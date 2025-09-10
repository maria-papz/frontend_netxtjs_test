// TODO: instead of refereshing the page, refetch from the server and update the table list upon submission

import { AutoForm } from "@/components/ui/autoform";
import { ZodProvider } from "@autoform/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUpdateTableMutation } from "@/redux/services/tablesApiSlice";

type FormData = {
  tableName?: string;
  tableDescription?: string;
};

type CreateTableFormProps = {
  tableName: string;
  tableDescription?: string;
  tableId: string;
  onClose: () => void;
};

const tableSchema = z.object({
  tableName: z.string().optional(),
  tableDescription: z.string().optional(),
});

type SubmitProps = {
  data: FormData;
  onClose: () => void;
};

const schemaProvider = new ZodProvider(tableSchema);

const EditTableForm: React.FC<CreateTableFormProps> = ({
  tableName,
  tableDescription,
  tableId,
  onClose,
}) => {
  const { toast } = useToast();
  const [updateTable] = useUpdateTableMutation();

  const handleSubmit = async ({data,onClose}:SubmitProps) => {
    // Only include fields that are actually defined in the request
    const updateData: { table_name?: string; table_description?: string } = {};

    if (data.tableName !== undefined) {
      updateData.table_name = data.tableName;
    }

    if (data.tableDescription !== undefined) {
      updateData.table_description = data.tableDescription;
    }

    try {
      await updateTable({ id: tableId, ...updateData }).unwrap();
      console.log("Table edited successfully");
      toast({
        title: `Table Updated Successfully!`,
        description: `${data.tableName} has been updated.`,
      });
      onClose();
      window.location.reload();
    } catch (error: unknown) {
      console.error("Error updating table:", error);
      const errorMessage = error && typeof error === 'object' && 'data' in error &&
        error.data && typeof error.data === 'object' && 'error' in error.data
        ? String(error.data.error)
        : "Failed to update table";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <AutoForm
        schema={schemaProvider}
        onSubmit={(formData) => {
          console.log(formData);
          // Ensure the formData is properly typed as FormData
          const typedData: FormData = {
            tableName: formData.tableName,
            tableDescription: formData.tableDescription
          };
          handleSubmit({data: typedData, onClose});
        }}
        withSubmit
        defaultValues={{ tableName, tableDescription }}>
        </AutoForm>
    </>
  );
};

export default EditTableForm;
