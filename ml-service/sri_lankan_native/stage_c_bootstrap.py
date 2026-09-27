"""
Stage C: bootstrap confidence intervals for the selected LogisticRegression
model.

Approach: collect out-of-fold predictions from the same nested repeated
stratified CV protocol used in Stage B (5x3 = 15 outer folds, hyperparameter
selection nested via 3-fold inner GridSearchCV on training rows only, exactly
as in evaluate_model.py's cross_validate_model()). Because n_repeats=3, each
of the 311 rows is predicted exactly 3 times (once per repeat), giving 933
paired (true, predicted) out-of-fold observations. Bootstrap resampling
(1000 resamples, sampling these 933 pairs with replacement) is then used to
estimate CIs on accuracy, macro F1, and per-class F1 -- this reflects
prediction uncertainty at this sample size without refitting the model 1000
times (infeasible with nested grid search at n=311).

Does not touch anything under ../experiments/global_to_local_generalization/.
"""

import json
import warnings

import numpy as np
from sklearn.base import clone
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support
from sklearn.model_selection import GridSearchCV, RepeatedStratifiedKFold

from evaluate_model import RISK_LEVELS, build_preprocessing_pipeline, load_data

warnings.filterwarnings("ignore")

RESULTS_PATH = "results_bootstrap_ci.json"
N_BOOTSTRAP = 1000
RANDOM_STATE = 42


def collect_out_of_fold_predictions(X, y):
    feature_columns = list(X.columns)
    model = LogisticRegression(penalty="l2", solver="lbfgs", max_iter=2000, random_state=42)
    param_grid = {"model__C": [0.01, 0.1, 1.0, 10.0]}

    splitter = RepeatedStratifiedKFold(n_splits=5, n_repeats=3, random_state=RANDOM_STATE)

    all_true = []
    all_pred = []
    for train_idx, test_idx in splitter.split(X, y):
        pipeline = build_preprocessing_pipeline(clone(model), feature_columns)
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
        search = GridSearchCV(pipeline, param_grid, cv=3, scoring="f1_macro", n_jobs=-1)
        search.fit(X_train, y_train)
        preds = search.best_estimator_.predict(X_test)
        all_true.extend(y_test.tolist())
        all_pred.extend(preds.tolist())

    return np.array(all_true), np.array(all_pred)


def compute_metrics(y_true, y_pred):
    acc = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    _, _, per_class_f1, per_class_support = precision_recall_fscore_support(
        y_true, y_pred, labels=list(range(len(RISK_LEVELS))), zero_division=0
    )
    return acc, macro_f1, per_class_f1, per_class_support


def main():
    X, y = load_data()
    print("Collecting out-of-fold predictions via nested repeated CV (same protocol as Stage B)...")
    y_true, y_pred = collect_out_of_fold_predictions(X, y)
    n_obs = len(y_true)
    print(f"Collected {n_obs} out-of-fold (true, predicted) pairs "
          f"({len(X)} rows x 3 repeats).")

    point_acc, point_macro_f1, point_per_class_f1, point_support = compute_metrics(y_true, y_pred)
    print()
    print("Point estimates (pooled out-of-fold predictions, not bootstrap):")
    print(f"  Accuracy: {point_acc:.4f}")
    print(f"  Macro F1: {point_macro_f1:.4f}")
    for level, f1_val, support in zip(RISK_LEVELS, point_per_class_f1, point_support):
        print(f"  {level:10s} F1={f1_val:.4f}  support={support}")
    print()

    rng = np.random.RandomState(RANDOM_STATE)
    boot_acc = np.empty(N_BOOTSTRAP)
    boot_macro_f1 = np.empty(N_BOOTSTRAP)
    boot_per_class_f1 = np.empty((N_BOOTSTRAP, len(RISK_LEVELS)))
    boot_per_class_support = np.empty((N_BOOTSTRAP, len(RISK_LEVELS)), dtype=int)

    for b in range(N_BOOTSTRAP):
        idx = rng.randint(0, n_obs, size=n_obs)
        yt, yp = y_true[idx], y_pred[idx]
        acc, macro_f1, per_class_f1, support = compute_metrics(yt, yp)
        boot_acc[b] = acc
        boot_macro_f1[b] = macro_f1
        boot_per_class_f1[b] = per_class_f1
        boot_per_class_support[b] = support

    def ci(values):
        return {
            "mean": float(np.mean(values)),
            "std": float(np.std(values)),
            "ci_2.5%": float(np.percentile(values, 2.5)),
            "ci_97.5%": float(np.percentile(values, 97.5)),
        }

    results = {
        "stage": "C_bootstrap_ci",
        "model": "LogisticRegression",
        "nRows": len(X),
        "nOutOfFoldObservations": n_obs,
        "cvProtocolForOutOfFoldPredictions": (
            "RepeatedStratifiedKFold(n_splits=5, n_repeats=3, random_state=42); "
            "hyperparameter selection nested via GridSearchCV(cv=3, scoring=f1_macro) "
            "per outer fold, same as Stage B"
        ),
        "nBootstrap": N_BOOTSTRAP,
        "bootstrapMethod": (
            "Resample the pooled (true, predicted) out-of-fold pairs with replacement, "
            "n_obs draws per resample, recompute metrics; percentile CI (2.5/97.5)."
        ),
        "pointEstimates": {
            "accuracy": float(point_acc),
            "macroF1": float(point_macro_f1),
            "perClass": {
                level: {"f1": float(f1_val), "support": int(support)}
                for level, f1_val, support in zip(RISK_LEVELS, point_per_class_f1, point_support)
            },
        },
        "bootstrapCI": {
            "accuracy": ci(boot_acc),
            "macroF1": ci(boot_macro_f1),
            "perClassF1": {
                level: ci(boot_per_class_f1[:, i]) for i, level in enumerate(RISK_LEVELS)
            },
            "perClassSupportAcrossResamples": {
                level: {
                    "mean": float(np.mean(boot_per_class_support[:, i])),
                    "min": int(np.min(boot_per_class_support[:, i])),
                    "max": int(np.max(boot_per_class_support[:, i])),
                }
                for i, level in enumerate(RISK_LEVELS)
            },
        },
    }

    high_idx = RISK_LEVELS.index("High")
    frac_zero_high_f1 = float(np.mean(boot_per_class_f1[:, high_idx] == 0.0))
    results["highClassZeroF1Fraction"] = {
        "fractionOfResamplesWithExactlyZeroHighF1": frac_zero_high_f1,
        "nResamplesWithZeroHighF1": int(np.sum(boot_per_class_f1[:, high_idx] == 0.0)),
        "interpretationNote": (
            "Fraction of the 1000 bootstrap resamples in which the model's High-class F1 "
            "was exactly 0.0 -- i.e. it correctly identified zero True-High rows as High in "
            "that resample. Distinguishes 'consistent weak signal' (low fraction, F1 usually "
            "small-but-nonzero) from 'often complete failure' (high fraction, F1 is bimodal "
            "between 0 and something higher rather than clustered near its mean)."
        ),
    }

    print(f"Fraction of bootstrap resamples with High F1 exactly 0: {frac_zero_high_f1:.4f} "
          f"({results['highClassZeroF1Fraction']['nResamplesWithZeroHighF1']}/{N_BOOTSTRAP})")
    print()

    print("Bootstrap 95% CIs:")
    print(f"  Accuracy: {results['bootstrapCI']['accuracy']['mean']:.4f} "
          f"[{results['bootstrapCI']['accuracy']['ci_2.5%']:.4f}, "
          f"{results['bootstrapCI']['accuracy']['ci_97.5%']:.4f}]")
    print(f"  Macro F1: {results['bootstrapCI']['macroF1']['mean']:.4f} "
          f"[{results['bootstrapCI']['macroF1']['ci_2.5%']:.4f}, "
          f"{results['bootstrapCI']['macroF1']['ci_97.5%']:.4f}]")
    for level in RISK_LEVELS:
        c = results["bootstrapCI"]["perClassF1"][level]
        support = results["pointEstimates"]["perClass"][level]["support"]
        print(f"  {level:10s} F1: {c['mean']:.4f} [{c['ci_2.5%']:.4f}, {c['ci_97.5%']:.4f}]  "
              f"(support={support})")

    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print()
    print(f"Saved results to {RESULTS_PATH}")


if __name__ == "__main__":
    main()
