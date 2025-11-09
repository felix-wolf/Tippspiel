import { X } from "lucide-react";

export const ClearIcon = ({
  showClear,
  setSearchString,
  searchString,
  setFocus,
  onClear,
}: {
  showClear: boolean;
  setSearchString: Function;
  searchString: string;
  setFocus: Function;
  onClear: Function;
}) => {
  const handleClearSearchString = () => {
    setSearchString({ target: { value: "" } });
    setFocus();
    onClear();
  };

  if (!showClear) {
    return null;
  }

  if (!searchString || searchString?.length <= 0) {
    return null;
  }

  return (
    <X className="m-2" onClick={handleClearSearchString}/>
  );
};
