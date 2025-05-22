import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { Category } from '../../types/common';
import { Button } from '@/components/ui';
import { Picker } from '@react-native-picker/picker';
import { ImageUploader } from '../shared/ImageUploader';

export interface JobFormValues {
  title: string;
  description: string;
  category: string;
  urgency: 'low' | 'medium' | 'high';
  images: string[];
}

export interface JobRequestFormProps {
  onSubmit: (values: JobFormValues, helpers: FormikHelpers<JobFormValues>) => Promise<void>;
  categories: Category[];
  loading: boolean;
}

const validationSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  category: Yup.string().required('Category is required'),
  urgency: Yup.string().oneOf(['low', 'medium', 'high']).required('Urgency level is required'),
  images: Yup.array().min(1, 'At least one image is required'),
});

const initialValues: JobFormValues = {
  title: '',
  description: '',
  category: '',
  urgency: 'medium',
  images: [],
};

export const JobRequestForm: React.FC<JobRequestFormProps> = ({
  onSubmit,
  categories,
  loading
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, values, errors, touched, handleChange, handleBlur, setFieldValue, isValid }) => {
        const onPressSubmit = () => {
          handleSubmit();
        };

        return (
          <View style={styles.container}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                onChangeText={handleChange('title')}
                onBlur={handleBlur('title')}
                value={values.title}
                placeholder="What needs fixing?"
              />
              {touched.title && errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                value={values.description}
                placeholder="Describe the issue in detail"
                multiline
                numberOfLines={4}
              />
              {touched.description && errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <Picker
                selectedValue={values.category}
                onValueChange={handleChange('category')}
                style={styles.picker}
              >
                <Picker.Item label="Select a category" value="" />
                {categories.map((category) => (
                  <Picker.Item
                    key={category.id}
                    label={category.name}
                    value={category.id}
                  />
                ))}
              </Picker>
              {touched.category && errors.category && (
                <Text style={styles.errorText}>{errors.category}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Urgency</Text>
              <Picker
                selectedValue={values.urgency}
                onValueChange={handleChange('urgency')}
                style={styles.picker}
              >
                <Picker.Item label="Low" value="low" />
                <Picker.Item label="Medium" value="medium" />
                <Picker.Item label="High" value="high" />
              </Picker>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Photos</Text>
              <ImageUploader
                onImageSelected={(uri) => {
                  setFieldValue('images', [...values.images, uri]);
                }}
                placeholder="Take a photo of the issue"
              />
              {values.images.length > 0 && (
                <Text style={styles.helperText}>
                  {values.images.length} photo{values.images.length > 1 ? 's' : ''} added
                </Text>
              )}
              {touched.images && errors.images && (
                <Text style={styles.errorText}>{errors.images}</Text>
              )}
            </View>

            <Button
              onPress={onPressSubmit}
              loading={loading}
              disabled={!isValid || loading}
            >
              Submit Request
            </Button>
          </View>
        );
      }}
    </Formik>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },
}); 