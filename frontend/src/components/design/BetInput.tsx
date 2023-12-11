import ReactSearchAutocomplete from "./SearchBox/ReactSearchAutocomplete";

type BetInputProps = {
  place: number;
};

export function BetInput({ place }: BetInputProps) {
  const handleOnSearch = (string: string, results: Item[]) => {
    // onSearch will have as the first callback parameter
    // the string searched and for the second the results.
    console.log(string, results);
  };

  const handleOnHover = (result: Item) => {
    // the item hovered
    console.log(result);
  };

  const handleOnSelect = (item: Item) => {
    // the item selected
    console.log(item);
  };

  const handleOnFocus = () => {
    console.log("Focused");
  };

  type Item = {
    id: string;
    name: string;
  };

  const formatResult = (item: Item) => {
    return (
      <>
        <span style={{ display: "block", textAlign: "left" }}>
          id: {item.id}
        </span>
        <span style={{ display: "block", textAlign: "left" }}>
          name: {item.name}
        </span>
      </>
    );
  };

  const items: Item[] = [
    { id: "1", name: "JT" },
    { id: "2", name: "Sturla" },
  ];

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
        zindex={5 - place}
        inputSearchString={"hello"}
      />
    </>
  );
}
