import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IndicatorMetadata } from "@/types/dashboard";

interface IndicatorInformationModalProps {
  indicator: string;
  indicatorsObject: { [key: string]: IndicatorMetadata };
  isOpen: boolean;
  onClose: () => void;
}

const IndicatorInformationModal: React.FC<IndicatorInformationModalProps> = ({
  indicator,
  indicatorsObject,
  isOpen,
  onClose,
}) => {
  const indicatorData = indicatorsObject[indicator];

  return (
    <Credenza open={isOpen} onOpenChange={onClose}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>
            {indicatorData?.name || "Indicator Information"}
            <h5 className="text-slate-600 mt-2">{indicatorData?.code}</h5>
          </CredenzaTitle>
          <CredenzaDescription className="mt-2">
            {indicatorData?.description || "No description available."}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <Table>
            <TableCaption>Details about the selected indicator.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Base Year</TableCell>
                <TableCell>
                  {indicatorData?.base_year?.[0] !== undefined
                    ? indicatorData.base_year[0]
                    : "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Source</TableCell>
                <TableCell>{indicatorData?.source?.[0] || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>{indicatorData?.category?.[0] || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Seasonally Adjusted</TableCell>
                <TableCell>
                  {indicatorData?.seasonally_adjusted ? "Yes" : "No"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Frequency</TableCell>
                <TableCell>
                  {indicatorData?.frequency?.[0] || "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Custom</TableCell>
                <TableCell>{indicatorData?.custom_indicator ? "Yes" : "No"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Current Prices</TableCell>
                <TableCell>
                  {indicatorData?.current_prices ? "Yes" : "No"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Unit</TableCell>
                <TableCell>{indicatorData?.unit?.[0] || "N/A"}</TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
            </TableFooter>
          </Table>
        </CredenzaBody>
        <CredenzaFooter>
          <CredenzaClose asChild>
            <button onClick={onClose}>Close</button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
};

export default IndicatorInformationModal;
