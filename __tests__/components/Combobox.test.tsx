import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Combobox from '@/components/Combobox';

describe('Combobox Component', () => {
  const mockOptions = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render with label and placeholder', () => {
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Select an option')).toBeInTheDocument();
    });

    it('should display the selected value', () => {
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value="Apple"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue('Apple')).toBeInTheDocument();
    });

    it('should render clear button when value is set', () => {
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value="Apple"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText('Clear')).toBeInTheDocument();
    });

    it('should not render clear button when value is empty', () => {
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByLabelText('Clear')).not.toBeInTheDocument();
    });
  });

  describe('Filtering Logic', () => {
    it('should filter options based on search term', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.click(input);
      await user.type(input, 'app');

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
      });

      expect(screen.queryByText('Banana')).not.toBeInTheDocument();
      expect(screen.queryByText('Cherry')).not.toBeInTheDocument();
    });

    it('should be case-insensitive when filtering', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.click(input);
      await user.type(input, 'APPLE');

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
      });
    });

    it('should show "No options found" when no matches', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.click(input);
      await user.type(input, 'xyz');

      await waitFor(() => {
        expect(screen.getByText('No options found')).toBeInTheDocument();
      });
    });

    it('should show all options when search term is empty', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.click(input);

      await waitFor(() => {
        mockOptions.forEach(option => {
          expect(screen.getByText(option)).toBeInTheDocument();
        });
      });
    });
  });

  describe('User Interactions', () => {
    it('should open dropdown when input is focused', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
      });
    });

    it('should call onChange when option is selected', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Apple'));

      expect(mockOnChange).toHaveBeenCalledWith('Apple');
    });

    it('should clear value when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value="Apple"
          onChange={mockOnChange}
        />
      );

      const clearButton = screen.getByLabelText('Clear');
      await user.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Combobox
            id="test-combobox"
            label="Test Label"
            placeholder="Select an option"
            options={mockOptions}
            value=""
            onChange={mockOnChange}
          />
          <div data-testid="outside">Outside</div>
        </div>
      );

      const input = screen.getByLabelText('Test Label');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByText('Apple')).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should select first filtered option on Enter key', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.type(input, 'app{Enter}');

      expect(mockOnChange).toHaveBeenCalledWith('Apple');
    });

    it('should clear selection when input is cleared', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value="Apple"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.clear(input);

      expect(mockOnChange).toHaveBeenCalledWith('');
    });
  });

  describe('Add New Functionality', () => {
    it('should show "Add new" option when allowAddNew is true and no matches found', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
          allowAddNew={true}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.click(input);
      await user.type(input, 'New Fruit');

      await waitFor(() => {
        expect(screen.getByText(/Add new:/)).toBeInTheDocument();
        expect(screen.getByText(/"New Fruit"/)).toBeInTheDocument();
      });
    });

    it('should call onChange with new value when "Add new" is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
          allowAddNew={true}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.click(input);
      await user.type(input, 'New Fruit');

      await waitFor(() => {
        expect(screen.getByText(/Add new:/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Add new:/));

      expect(mockOnChange).toHaveBeenCalledWith('New Fruit');
    });

    it('should add new value on Enter key when no matches and allowAddNew is true', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
          allowAddNew={true}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.type(input, 'New Fruit{Enter}');

      expect(mockOnChange).toHaveBeenCalledWith('New Fruit');
    });

    it('should not show "Add new" when allowAddNew is false', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
          allowAddNew={false}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.click(input);
      await user.type(input, 'New Fruit');

      await waitFor(() => {
        expect(screen.getByText('No options found')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Add new:/)).not.toBeInTheDocument();
    });
  });

  describe('Format Option', () => {
    it('should apply custom formatOption function', async () => {
      const user = userEvent.setup();
      const formatOption = (option: string) => option.toUpperCase();

      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
          formatOption={formatOption}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('APPLE')).toBeInTheDocument();
        expect(screen.getByText('BANANA')).toBeInTheDocument();
      });
    });

    it('should filter using formatted options', async () => {
      const user = userEvent.setup();
      const formatOption = (option: string) => `Fruit: ${option}`;

      render(
        <Combobox
          id="test-combobox"
          label="Test Label"
          placeholder="Select an option"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
          formatOption={formatOption}
        />
      );

      const input = screen.getByLabelText('Test Label');
      await user.click(input);
      await user.type(input, 'Fruit: App');

      await waitFor(() => {
        expect(screen.getByText('Fruit: Apple')).toBeInTheDocument();
      });

      expect(screen.queryByText('Fruit: Banana')).not.toBeInTheDocument();
    });
  });
});
