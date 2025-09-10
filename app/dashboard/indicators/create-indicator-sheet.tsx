
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import CreateIndicatorForm from "./create-indicator-form";

interface CreateTableSheetProps {
  sheetTrigger: JSX.Element;
  code: string[]
}

const CreateTableSheet: React.FC<CreateTableSheetProps> = ({ sheetTrigger, code }) => {
  console.log("sheet code",code)
  return (
    <Sheet>
      <SheetTrigger>
        {sheetTrigger}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create a new indicator</SheetTitle>
          <SheetDescription>
            Enter indicator details below.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-3">
          <CreateIndicatorForm codes={code} />
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
