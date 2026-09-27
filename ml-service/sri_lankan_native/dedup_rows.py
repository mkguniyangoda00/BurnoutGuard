"""
Drops the second row of each exact-duplicate submission pair identified by
the authenticity check (see DATA_QUALITY_NOTES.md): rows 76, 130, 245
(0-indexed) are each identical to the row immediately preceding them across
all 46 non-Timestamp raw survey columns, submitted 1-21 seconds apart.

Keeps the first-submitted row of each pair. Row positions in
sri_lankan_model_ready.csv align 1:1 with raw_datasets/sri_lankan_developer_burnout.csv
row order (verified: no sorting/filtering was applied anywhere upstream in
build_target.py or build_features.py), so the same 0-indexed positions are
dropped here.
"""

import pandas as pd

INPUT_PATH = "sri_lankan_model_ready.csv"

DUPLICATE_ROW_INDICES_TO_DROP = [76, 130, 245]


def main():
    df = pd.read_csv(INPUT_PATH)
    before = len(df)

    df = df.drop(index=DUPLICATE_ROW_INDICES_TO_DROP).reset_index(drop=True)
    after = len(df)

    df.to_csv(INPUT_PATH, index=False)
    print(f"Rows before dedup: {before}")
    print(f"Rows dropped: {before - after} (indices {DUPLICATE_ROW_INDICES_TO_DROP})")
    print(f"Rows after dedup: {after}")
    print(f"Saved {after} rows x {df.shape[1]} columns to {INPUT_PATH}")


if __name__ == "__main__":
    main()
