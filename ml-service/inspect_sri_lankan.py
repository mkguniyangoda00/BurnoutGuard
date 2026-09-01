import pandas as pd

file_path = "raw_datasets/sri_lankan_developer_burnout.csv"

df = pd.read_csv(file_path)

print("=" * 70)
print("SRI LANKAN DATASET")
print("=" * 70)

print("Rows:", len(df))
print("Columns:", len(df.columns))

# The six burnout-related columns
burnout_cols = df.columns[9:15]

print("\nBURNOUT COLUMNS:")
for col in burnout_cols:
    print("-", repr(col))

print("\n" + "=" * 70)
print("UNIQUE VALUES")
print("=" * 70)

for col in burnout_cols:
    values = sorted(df[col].dropna().unique().tolist())
    print(f"\n{col}")
    print(values)

print("\n" + "=" * 70)
print("VALUE COUNTS")
print("=" * 70)

for col in burnout_cols:
    print(f"\n--- {col} ---")
    print(df[col].value_counts(dropna=False).sort_index())

print("\n" + "=" * 70)
print("MISSING VALUES")
print("=" * 70)

for col in burnout_cols:
    print(f"{col}: {df[col].isna().sum()}")

print("\n" + "=" * 70)
print("DESCRIPTIVE STATISTICS")
print("=" * 70)

print(df[burnout_cols].describe().to_string())
