import ReactSearchAutocomplete from "./SearchBox/ReactSearchAutocomplete";

type BetInputProps = {
  place: number;
  prev_selected?: BetInputItem;
  items: BetInputItem[];
  onSelect: (item: BetInputItem, place: number) => void;
};

export type BetInputItem = {
  id?: string;
  flag: string;
  name: string;
};

export function BetInput({
  place,
  prev_selected,
  items,
  onSelect: _onSelect,
}: BetInputProps) {
  const handleOnSearch = (string: string, results: BetInputItem[]) => {
    // onSearch will have as the first callback parameter
    // the string searched and for the second the results.
    console.log(string, results);
  };

  const handleOnHover = (result: BetInputItem) => {
    // the item hovered
    console.log("hover", result);
  };

  const handleOnSelect = (item: BetInputItem) => {
    // the item selected
    console.log("select", item);
    _onSelect(item, place);
  };

  const handleOnFocus = () => {
    console.log("Focused");
  };

  const formatResult = (item: BetInputItem) => {
    return (
      <span style={{ display: "block", textAlign: "left" }}>
        {item.flag} {item.name}
      </span>
    );
  };

  return (
    <>
      <ReactSearchAutocomplete
        items={items}
        onSearch={handleOnSearch}
        onHover={handleOnHover}
        onSelect={handleOnSelect}
        onFocus={handleOnFocus}
        formatResult={formatResult}
        placeholder={"Platz " + place}
        z_index={5 - place}
        inputSearchString={prev_selected?.name ?? ""}
      />
    </>
  );
}
