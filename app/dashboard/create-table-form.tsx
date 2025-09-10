"use client";

import { AutoForm } from "@/components/ui/autoform";
import { ZodProvider } from "@autoform/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useCreateTableMutation } from "@/redux/services/tablesApiSlice";

type formData = { tableName: string; tableDescription?: string | undefined };

const tableSchema = z.object({
  tableName: z.string().min(1, "Table name is required"), // Validate that the table name is a non-empty string
	tableDescription: z.string().optional(), // Optionally validate that the table description is a string
});

const schemaProvider = new ZodProvider(tableSchema);

const CreateTableForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [createTable] = useCreateTableMutation();

  const handleSubmit = async (data: formData) => {
    try {
      const response = await createTable({
        table_name: data.tableName,
        table_description: data.tableDescription,
      }).unwrap();

      console.log("Table created successfully:", response);
      toast({
        title: `Table Created Successfully!`,
        description: `${data.tableName}`,
      });
      router.push(`/dashboard/tables/${response.table_id}`);
    } catch (error) {
      console.error("Error creating table:", error);
    }
  };

  return (
    <>
      <AutoForm
        schema={schemaProvider}
        onSubmit={(data) => {
          console.log(data);
          handleSubmit(data);
        }}
        withSubmit
      />
    </>
  );
};

export default CreateTableForm;
