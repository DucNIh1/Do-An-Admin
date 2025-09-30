const customStyles = {
  control: (provided: React.CSSProperties, state: { isFocused: any }) => ({
    ...provided,
    minHeight: "40px",
    borderColor: state.isFocused ? "#083970" : "#D1D5DB",
    boxShadow: state.isFocused ? "0 0 0 1px #083970" : "none",
    "&:hover": {
      borderColor: state.isFocused ? "#083970" : "#A1A1AA",
    },
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
