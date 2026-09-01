#!/usr/bin/env python3
import pandas as pd
import os

# Check Sri Lankan dataset
sl = pd.read_csv('raw_datasets/sri_lankan_developer_burnout.csv')
print("=" * 80)
print("SRI LANKAN DATASET (raw_datasets/sri_lankan_developer_burnout.csv)")
print("=" * 80)
print(f"Shape: {sl.shape}")
print(f"\nColumns: {list(sl.columns)}")
print(f"\nHas burnout_score: {'burnout_score' in sl.columns}")
print(f"Non-null counts:\n{sl.notna().sum()}")
print(f"\nFirst row:\n{sl.iloc[0].to_dict()}")

# Check if it's in dataset.csv
print("\n" + "=" * 80)
print("CHECKING IF SRI LANKAN DATA IS IN dataset.csv")
print("=" * 80)

if os.path.exists('dataset.csv'):
    df = pd.read_csv('dataset.csv')
    print(f"dataset.csv shape: {df.shape}")
    print(f"Has source_dataset column: {'source_dataset' in df.columns}")
    if 'source_dataset' in df.columns:
        print(f"\nSource dataset value counts:")
        print(df['source_dataset'].value_counts())
        sl_in_dataset = (df['source_dataset'] == 'sri_lankan_developer_burnout').sum()
        print(f"\nSri Lankan rows in dataset.csv: {sl_in_dataset}")

# Check if there's a separate holdout file
print("\n" + "=" * 80)
print("CHECKING FOR SEPARATE HOLDOUT FILES")
print("=" * 80)
for fname in ['sri_lankan_developer_holdout.csv', 'Untitled_form.csv', 'raw_datasets/Untitled_form.csv']:
    if os.path.exists(fname):
        print(f"Found: {fname}")
        df_test = pd.read_csv(fname)
        print(f"  Shape: {df_test.shape}")
        print(f"  Columns: {list(df_test.columns)[:10]}")
