import { fireEvent, render as renderRTL, screen } from '@tests/utils';

import { Form } from '../../../../components/Form';
import { EditFieldForm, EditFieldFormProps } from '../EditFieldForm';
import { ConfigurationFormData } from '../Form';

const ALL_ATTRIBUTES = [
  'string',
  'text',
  'richtext',
  'email',
  'password',
  'date',
  'time',
  'datetime',
  'timestamp',
  'integer',
  'biginteger',
  'float',
  'decimal',
  'uid',
  'enumeration',
  'boolean',
  'json',
  'media',
  'relation',
  'component',
  'dynamiczone',
  'blocks',
] as const;

/**
 * This list of attribute types impact the form either by hiding specific fields or having more that
 * should be tested separately.
 */
const UNIQUE_ATTRIBUTES = ['richtext', 'blocks', 'dynamiczone', 'component', 'relation', 'json'];
const BASIC_ATTRIBUTES = ALL_ATTRIBUTES.filter((type) => !UNIQUE_ATTRIBUTES.includes(type));

describe('EditFieldForm', () => {
  type FieldData = ConfigurationFormData['layout'][number]['children'][number];
  interface RenderProps extends Partial<EditFieldFormProps> {
    initialValues?: Record<string, FieldData>;
  }

  const INITIAL_DATA: Record<string, FieldData> = {
    field: {
      __temp_key__: 'a',
      description: '',
      editable: true,
      name: 'field',
      label: 'Field',
      size: 12,
    },
  };

  const render = ({ initialValues = INITIAL_DATA, ...props }: RenderProps = {}) =>
    renderRTL(
      <EditFieldForm
        attribute={{
          type: 'string',
        }}
        name="field"
        onClose={jest.fn()}
        {...props}
      />,
      {
        renderOptions: {
          wrapper: ({ children }) => (
            <Form initialValues={initialValues} method="PUT">
              {children}
            </Form>
          ),
        },
      }
    );

  it('should not allow submission and show an error if a required field is missing from the form', async () => {
    const { user } = render();

    await user.clear(screen.getByRole('textbox', { name: 'Label' }));

    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));

    expect(await screen.findByText('label is a required field')).toBeInTheDocument();
  });

  it('should call onClose when the user presses cancel or the close button', async () => {
    const onClose = jest.fn();

    const { user } = render({
      onClose,
    });

    await user.click(screen.getByRole('button', { name: 'Close the modal' }));

    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  describe('attribute forms', () => {
    BASIC_ATTRIBUTES.forEach((type) => {
      it(`should render all the fields excluding the mainField for the attribute type: ${type}`, () => {
        render({
          // @ts-expect-error - ignore the error as we are testing the form for each attribute type
          attribute: {
            type,
          },
        });

        expect(screen.getByRole('dialog', { name: 'Edit Field' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Edit Field' })).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Close the modal' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

        expect(screen.getByRole('textbox', { name: 'Label' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Editable' })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'Size' })).toBeInTheDocument();

        if (type !== 'boolean' && type !== 'media') {
          expect(screen.getByRole('textbox', { name: 'Placeholder' })).toBeInTheDocument();
        }
      });
    });

    ['component', 'dynamiczone'].forEach((type) => {
      it(`should hide all but the label and editable fields for the attribute type: ${type}`, () => {
        render({
          attribute: {
            // @ts-expect-error - ignore the error as we are testing the form for each attribute type
            type,
          },
        });

        expect(screen.getByRole('dialog', { name: 'Edit Field' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Edit Field' })).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Close the modal' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

        expect(screen.getByRole('textbox', { name: 'Label' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Editable' })).toBeInTheDocument();

        expect(screen.queryByRole('textbox', { name: 'Description' })).not.toBeInTheDocument();
        expect(screen.queryByRole('combobox', { name: 'Size' })).not.toBeInTheDocument();
        expect(screen.queryByRole('textbox', { name: 'Placeholder' })).not.toBeInTheDocument();
      });
    });

    ['blocks', 'richtext'].forEach((type) => {
      it(`should hide the size field for the attribute type: ${type}`, () => {
        render({
          attribute: {
            // @ts-expect-error - ignore the error as we are testing the form for each attribute type
            type,
          },
        });

        expect(screen.getByRole('dialog', { name: 'Edit Field' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Edit Field' })).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Close the modal' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

        expect(screen.getByRole('textbox', { name: 'Label' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Editable' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Placeholder' })).toBeInTheDocument();

        expect(screen.queryByRole('combobox', { name: 'Size' })).not.toBeInTheDocument();
      });
    });

    ['boolean', 'media'].forEach((type) => {
      it(`should hide the placeholder field for the attribute type: ${type}`, () => {
        render({
          attribute: {
            // @ts-expect-error - ignore the error as we are testing the form for each attribute type
            type,
          },
        });

        expect(screen.getByRole('dialog', { name: 'Edit Field' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Edit Field' })).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Close the modal' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

        expect(screen.getByRole('textbox', { name: 'Label' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Editable' })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'Size' })).toBeInTheDocument();

        expect(screen.queryByRole('textbox', { name: 'Placeholder' })).not.toBeInTheDocument();
      });
    });

    it(`should hide the placeholder and size fields for the attribute type: json`, () => {
      render({
        attribute: {
          type: 'json',
        },
      });

      expect(screen.getByRole('dialog', { name: 'Edit Field' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Edit Field' })).toBeInTheDocument();

      expect(screen.getByRole('button', { name: 'Close the modal' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

      expect(screen.getByRole('textbox', { name: 'Label' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Editable' })).toBeInTheDocument();

      expect(screen.queryByRole('combobox', { name: 'Size' })).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox', { name: 'Placeholder' })).not.toBeInTheDocument();
    });

    it("should render the mainField option for relation attributes and have a list of potential mainField attributes from it's targetModel", async () => {
      const { user } = render({
        attribute: {
          relation: 'manyToOne',
          target: 'api::address.address',
          // @ts-expect-error - ignore the error as we are testing the form for each attribute type
          targetModel: 'api::address.address',
          type: 'relation',
        },
      });

      expect(screen.getByRole('dialog', { name: 'Edit Field' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Edit Field' })).toBeInTheDocument();

      expect(screen.getByRole('button', { name: 'Close the modal' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

      expect(screen.getByRole('textbox', { name: 'Label' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Editable' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Placeholder' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Size' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Entry title' })).toBeInTheDocument();

      await user.click(screen.getByRole('combobox', { name: 'Entry title' }));

      expect(screen.getByRole('option', { name: 'id' })).toBeInTheDocument();
    });
  });
});
