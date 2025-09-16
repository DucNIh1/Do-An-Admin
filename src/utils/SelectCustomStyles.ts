const customStyles = {
  control: (provided: React.CSSProperties) => ({
    ...provided,
    minHeight: "40px",
    height: "42px",
  }),
  valueContainer: (provided: React.CSSProperties) => ({
    ...provided,
    height: "42px",
    padding: "0 8px",
  }),
  input: (provided: React.CSSProperties) => ({
    ...provided,
    margin: 0,
    padding: 0,
  }),
  indicatorsContainer: (provided: React.CSSProperties) => ({
    ...provided,
    height: "42px",
  }),
};

export default customStyles;
