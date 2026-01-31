import { View, StyleSheet } from 'react-native';
import { SelectionButton } from './SelectionButton';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface SelectionGroupProps {
  options: Option[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  baseDelay?: number;
}

export function SelectionGroup({
  options,
  selectedValue,
  onSelect,
  baseDelay = 300,
}: SelectionGroupProps) {
  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <SelectionButton
          key={option.value}
          title={option.label}
          description={option.description}
          selected={selectedValue === option.value}
          onPress={() => onSelect(option.value)}
          delay={baseDelay + index * 50}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});
