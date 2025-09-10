
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import CreateTableForm from "./create-table-form";

interface CreateTableSheetProps {
  sheetTrigger: JSX.Element;
}

const CreateTableSheet: React.FC<CreateTableSheetProps> = ({ sheetTrigger }) => {
  return (
    <Sheet>
      <SheetTrigger>
        {sheetTrigger}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create a new table</SheetTitle>
          <SheetDescription>
            Enter a name and description below.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-3">
          <CreateTableForm />
        </div>
        {/* <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter> */}
      </SheetContent>
    </Sheet>
  );
};

export default CreateTableSheet;
