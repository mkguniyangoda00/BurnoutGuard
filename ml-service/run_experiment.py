"""Single reproducible entry point for the BurnoutGuard research experiment.

Order:
raw sources -> harmonization -> canonical target -> predictor-only data ->
Sri Lankan source split -> development preprocessing/CV -> model selection ->
internal evaluation -> untouched Sri Lankan evaluation -> uncertainty -> SHAP.

Run from ml-service with: python run_experiment.py
"""

import json
import os
import sys
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

import generate_dataset
import harmonize_datasets
from explain import compute_pipeline_shap_results
from preprocess import FEATURE_COLUMNS, encode_labels
from train import (
    CLASS_ORDER,
    SOURCE_TARGET,
    bootstrap_metric_ci,
    build_baseline_models,
    collect_oof_predictions,
    compare_models_cv,
    compute_shap_stability,
    create_sri_lankan_holdout,
    evaluate,
    fit_best_model,
    get_model_candidates,
)

RANDOM_STATE = 42
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def _metric_line(metrics, name):
    value = metrics.get(name)
    return "n/a" if value is None else f"{value:.4f}"


def _print_evaluation(metrics):
    print(f"Accuracy: {_metric_line(metrics, 'accuracy')}")
    print(f"Macro F1: {_metric_line(metrics, 'macroF1')}")
    print(f"Weighted F1: {_metric_line(metrics, 'weightedF1')}")
    print(f"ROC-AUC: {_metric_line(metrics, 'rocAUC')}")
    print("Per-class F1:")
    for class_name in CLASS_ORDER:
        print(f"  {class_name}: {metrics['perClass'][class_name]['f1']:.4f}")
    print(f"Critical recall: {metrics['criticalRecall']:.4f}")
    print("Confusion matrix (rows=true, columns=predicted; Low, Moderate, High, Critical):")
    for row in metrics["confusionMatrix"]["matrix"]:
        print(f"  {row}")


def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    np.random.seed(RANDOM_STATE)
    os.makedirs(MODELS_DIR, exist_ok=True)

    # Rebuild source-derived inputs so this entry point is genuinely end to end.
    harmonize_datasets.main()
    generate_dataset.main()
    raw_df = pd.read_csv("dataset.csv", low_memory=False)
    df = encode_labels(raw_df)

    X_dev_all, y_dev_all, X_sl_holdout, y_sl_holdout = create_sri_lankan_holdout(df)
    source_train = df.loc[X_dev_all.index].copy()
    sl_holdout = df.loc[X_sl_holdout.index].copy()
    train_df, temp_df = train_test_split(
        source_train,
        test_size=0.4,
        random_state=RANDOM_STATE,
        stratify=source_train["riskLabel"],
    )
    cal_df, val_df = train_test_split(
        temp_df,
        test_size=0.5,
        random_state=RANDOM_STATE,
        stratify=temp_df["riskLabel"],
    )
    X_train, y_train = train_df[FEATURE_COLUMNS], train_df["riskLabel"]
    X_cal, y_cal = cal_df[FEATURE_COLUMNS], cal_df["riskLabel"]
    X_val, y_val = val_df[FEATURE_COLUMNS], val_df["riskLabel"]

    print("\nDATASET SUMMARY")
    print("----------------")
    print(f"Total records: {len(df)}")
    print("Records per source:")
    print(df["source_dataset"].value_counts().to_string())
    print(f"Sri Lankan total: {int((df['source_dataset'] == SOURCE_TARGET).sum())}")
    print(f"Sri Lankan development: {int((source_train['source_dataset'] == SOURCE_TARGET).sum())}")
    print(f"Sri Lankan holdout: {len(sl_holdout)}")

    print("\nTARGET SUMMARY")
    print("--------------")
    print("Target definition: riskLevel is the pooled quartile label of source-specific harmonized burnout measurements.")
    print(f"Class distribution: {df['riskLevel'].value_counts().reindex(CLASS_ORDER, fill_value=0).to_dict()}")

    leakage_features = [
        "riskLevel",
        "riskLabel",
        "harmonized_risk_norm",
        "burnout_measurement",
        "exhaustion_composite",
        "target_measurement_source",
    ]
    print("\nFEATURE SUMMARY")
    print("---------------")
    print(f"Total predictor features: {len(FEATURE_COLUMNS)}")
    print(f"Excluded leakage features: {leakage_features}")

    candidates = {**get_model_candidates(), **build_baseline_models()}
    cv_results = compare_models_cv(X_train, y_train, candidates)
    with open(os.path.join(MODELS_DIR, "cv_results.json"), "w", encoding="utf-8") as output:
        json.dump(cv_results, output, indent=2)

    print("\nMODEL EVALUATION")
    print("----------------")
    print(f"{'Candidate':<24} {'Macro F1 mean +/- SD':>24} {'ROC-AUC mean +/- SD':>24}")
    print("-" * 76)
    for name, result in cv_results.items():
        macro = result["macroF1"]
        auc = result["rocAUC"]
        macro_text = "n/a" if macro["mean"] is None else f"{macro['mean']:.4f} +/- {macro['std']:.4f}"
        auc_text = "n/a" if auc["mean"] is None else f"{auc['mean']:.4f} +/- {auc['std']:.4f}"
        print(f"{name:<24} {macro_text:>24} {auc_text:>24}")

    ml_candidates = get_model_candidates()
    selected_name = max(ml_candidates, key=lambda name: cv_results[name]["macroF1"]["mean"])
    _, final_pipeline, tuning_results = fit_best_model(
        X_train,
        y_train,
        candidate_names=[selected_name],
    )
    internal_metrics = evaluate(final_pipeline, X_val, y_val)
    external_metrics = evaluate(final_pipeline, X_sl_holdout, y_sl_holdout)

    print("\nFINAL INTERNAL EVALUATION")
    print("-------------------------")
    _print_evaluation(internal_metrics)
    print("\nSRI LANKAN EXTERNAL VALIDATION")
    print("------------------------------")
    _print_evaluation(external_metrics)

    print("\nSTATISTICAL COMPARISON")
    print("----------------------")
    oof_predictions = {}
    for name, candidate in ml_candidates.items():
        oof_predictions[name] = collect_oof_predictions(candidate[0], X_train, y_train)
    bootstrap_results = {}
    baseline_y, baseline_labels, baseline_probabilities = oof_predictions["LogisticRegression"]
    for name, (_, labels, probabilities) in oof_predictions.items():
        if name == "LogisticRegression":
            continue
        bootstrap_results[f"LogisticRegression_vs_{name}"] = {
            "macroF1": bootstrap_metric_ci(baseline_y, baseline_labels, labels, "macro_f1"),
            "rocAUC": bootstrap_metric_ci(baseline_y, baseline_probabilities, probabilities, "roc_auc"),
        }
        result = bootstrap_results[f"LogisticRegression_vs_{name}"]
        print(f"LogisticRegression vs {name}: Macro F1 CI [{result['macroF1']['ci_lower']:.4f}, {result['macroF1']['ci_upper']:.4f}]")
    with open(os.path.join(MODELS_DIR, "bootstrap_comparisons.json"), "w", encoding="utf-8") as output:
        json.dump(bootstrap_results, output, indent=2)

    print("\nSHAP")
    print("----")
    shap_results = compute_pipeline_shap_results(final_pipeline, X_val, local_rows=3)
    shap_results["model"] = selected_name
    shap_results["data"] = "internal development validation subset"
    shap_results["stability"] = compute_shap_stability(final_pipeline, X_train, y_train)
    print(f"Top features: {shap_results['featureRanking'][:10]}")
    print(f"Stability results: {shap_results['stability']['appearanceRates'][:5]}")
    with open(os.path.join(MODELS_DIR, "shap_results.json"), "w", encoding="utf-8") as output:
        json.dump(shap_results, output, indent=2)

    preprocessing = final_pipeline.named_steps["preprocessing"]
    model = final_pipeline.named_steps["model"]
    version = f"experiment-{selected_name.lower()}-{RANDOM_STATE}"
    model_file = f"model_{version}.pkl"
    preprocessing_file = f"scaler_{version}.pkl"
    joblib.dump(model, os.path.join(MODELS_DIR, model_file))
    joblib.dump(preprocessing, os.path.join(MODELS_DIR, preprocessing_file))

    model_metadata = {
        "version": version,
        "algorithm": selected_name,
        "modelFile": model_file,
        "scalerFile": preprocessing_file,
        "featureColumns": FEATURE_COLUMNS,
        "riskLevels": CLASS_ORDER,
        "classOrder": CLASS_ORDER,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "validation": {
            "internalEvaluation": internal_metrics,
            "externalSriLankaEvaluation": external_metrics,
        },
        "dataSplits": {
            "internalTrainingRows": len(train_df),
            "internalEvaluationRows": len(val_df),
            "sriLankanTotal": int((df["source_dataset"] == SOURCE_TARGET).sum()),
            "sriLankanDevelopment": int((source_train["source_dataset"] == SOURCE_TARGET).sum()),
            "sriLankanHoldout": len(sl_holdout),
        },
        "status": "Active",
    }
    with open(os.path.join(MODELS_DIR, "metadata.json"), "w", encoding="utf-8") as output:
        json.dump(model_metadata, output, indent=2)

    evaluation_results = {
        "classOrder": CLASS_ORDER,
        "internalEvaluation": internal_metrics,
        "externalSriLankaEvaluation": external_metrics,
    }
    with open(os.path.join(MODELS_DIR, "evaluation_results.json"), "w", encoding="utf-8") as output:
        json.dump(evaluation_results, output, indent=2)

    experiment_results = {
        "experiment": "BurnoutGuard authoritative end-to-end research pipeline",
        "randomState": RANDOM_STATE,
        "selectedModel": selected_name,
        "classOrder": CLASS_ORDER,
        "predictorFeatures": FEATURE_COLUMNS,
        "excludedLeakageFeatures": leakage_features,
        "dataSplits": {
            "total": len(df),
            "development": len(source_train),
            "internalTraining": len(train_df),
            "internalCalibration": len(cal_df),
            "internalEvaluation": len(val_df),
            "sriLankanTotal": int((df["source_dataset"] == SOURCE_TARGET).sum()),
            "sriLankanDevelopment": int((source_train["source_dataset"] == SOURCE_TARGET).sum()),
            "sriLankanHoldout": len(sl_holdout),
        },
        "cvResults": cv_results,
        "tuningResults": tuning_results,
        "internalEvaluation": internal_metrics,
        "externalSriLankaEvaluation": external_metrics,
        "bootstrapComparisons": bootstrap_results,
        "shap": shap_results,
        "artifacts": {
            "model": model_file,
            "preprocessing": preprocessing_file,
            "cv": "cv_results.json",
            "evaluation": "evaluation_results.json",
            "bootstrap": "bootstrap_comparisons.json",
            "shap": "shap_results.json",
            "metadata": "metadata.json",
        },
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    with open(os.path.join(MODELS_DIR, "experiment_results.json"), "w", encoding="utf-8") as output:
        json.dump(experiment_results, output, indent=2)
    print("\nSaved all experiment results under models/.")


if __name__ == "__main__":
    main()
