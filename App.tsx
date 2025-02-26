import React, { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { OPENAI_API_KEY } from '@env';

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pick Image from Gallery
  const pickImage = async () => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.7 }, async (response) => {
      if (response.didCancel) {return;}

      const base64Image = response.assets[0].base64;
      setImageUri(response.assets[0].uri);
      analyzeImage(base64Image);
    });
  };

  // Send Image to OpenAI API
  const analyzeImage = async (base64Image) => {
    setLoading(true);
    setNutritionData(null);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'What food is in this image? Provide only Total Estimated Nutrition. No more details' },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      console.log('OpenAI Response:', data);

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch response from OpenAI.');
      }

      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error('Invalid response from OpenAI');
      }

      setNutritionData(data.choices[0].message.content);
    } catch (error) {
      console.error('Error:', error);
      alert(`Failed to analyze image: ${error.message}`);
    }

    setLoading(false);
  };

  const formatNutritionText = (text) => {
    const [title, values] = text.split(':');
    const items = values.split(',').map(item => item.trim());

    return (
      <>
        <Text style={styles.sectionTitle}>{title.trim()}:</Text>
        {items.map((item, index) => (
          <Text key={index} style={styles.text}>• {item}</Text>
        ))}
      </>
    );
  };
    return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Food Nutrition Scanner</Text>
        <Button title="Pick from Gallery" onPress={pickImage} />
        {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
        {loading && <ActivityIndicator size="large" color="blue" />}
        {nutritionData && (
          <View style={styles.nutritionContainer}>
            <Text style={styles.labelTitle}>Nutrition Facts</Text>
            {nutritionData.error ? (
              <Text>{nutritionData.error}</Text>
            ) : (
              formatNutritionText(nutritionData)
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  image: {
    width: 300,
    height: 225,
    marginVertical: 20,
    borderRadius: 10,
  },
  nutritionContainer: {
    width: '90%',
    padding: 15,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#f9f9f9',
    marginTop: 20,
  },
  labelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#2c3e50',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#34495e',
  },
  boldText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 14,
    marginLeft: 10,
  },
});
