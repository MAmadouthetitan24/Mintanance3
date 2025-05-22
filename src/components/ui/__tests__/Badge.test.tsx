import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '../badge';

describe('Badge Component', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<Badge>Test Badge</Badge>);
    expect(getByText('Test Badge')).toBeTruthy();
  });

  it('renders with different variants', () => {
    const variants = [
      'default',
      'secondary',
      'destructive',
      'outline',
      'success',
      'primary',
      'premium',
      'info',
    ] as const;

    variants.forEach((variant) => {
      const { getByText } = render(<Badge variant={variant}>Test Badge</Badge>);
      expect(getByText('Test Badge')).toBeTruthy();
    });
  });

  it('applies custom styles', () => {
    const customStyle = { marginTop: 10 };
    const { getByTestId } = render(
      <Badge style={customStyle} testID="custom-badge">
        Test Badge
      </Badge>
    );
    
    const badge = getByTestId('custom-badge');
    expect(badge.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          marginTop: 10,
        }),
      ])
    );
  });
}); 