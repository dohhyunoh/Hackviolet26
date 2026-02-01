import kagglehub

import os

import pandas as pd

import numpy as np

import tensorflow as tf

from sklearn.model_selection import train_test_split



# 1. DOWNLOAD & LOAD

path = kagglehub.dataset_download("prasoonkottarathil/polycystic-ovary-syndrome-pcos")

csv_path = os.path.join(path, "PCOS_data_without_infertility.csv")

if not os.path.exists(csv_path):

excel_path = os.path.join(path, "PCOS_data_without_infertility.xlsx")

df = pd.read_excel(excel_path, sheet_name=1)

else:

df = pd.read_csv(csv_path)



df.columns = [col.strip() for col in df.columns]



# 2. PREPARE DATA

data = pd.DataFrame()

data['Cycle_Irregular'] = df['Cycle(R/I)'].map({2: 0, 4: 1})

data['Marker_Score'] = (

df['hair growth(Y/N)'] +

df['Skin darkening (Y/N)'] +

df['Hair loss(Y/N)'] +

df['Pimples(Y/N)']

) * 10

data['BMI'] = df['BMI']

data['Label'] = df['PCOS (Y/N)']



# 3. HYBRID INJECTION

def generate_voice(row):

if row['Label'] == 1:

return np.random.normal(loc=2.5, scale=0.8)

else:

return np.random.normal(loc=1.2, scale=0.4)



def generate_family(row):

if row['Label'] == 1:

return np.random.choice([0, 15], p=[0.4, 0.6])

else:

return np.random.choice([0, 15], p=[0.8, 0.2])



data['Voice_Jitter'] = data.apply(generate_voice, axis=1)

data['Family_History'] = data.apply(generate_family, axis=1)



# 4. TRAIN

X = data[['Cycle_Irregular', 'Marker_Score', 'Family_History', 'Voice_Jitter', 'BMI']].values.astype('float32')

y = data['Label'].values.astype('float32')

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)



model = tf.keras.Sequential([

tf.keras.layers.Dense(16, activation='relu', input_shape=(5,)),

tf.keras.layers.Dropout(0.2),

tf.keras.layers.Dense(8, activation='relu'),

tf.keras.layers.Dense(1, activation='sigmoid')

])



model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

model.fit(X_train, y_train, epochs=100, batch_size=16, verbose=1)



# 5. EXPORT

converter = tf.lite.TFLiteConverter.from_keras_model(model)

tflite_model = converter.convert()

with open('pcos_hybrid_model.tflite', 'wb') as f:

f.write(tflite_model)



print("\n✅ Model exported to pcos_hybrid_model.tflite")

print("📁 Move this file to assets/models/ in your React Native project")