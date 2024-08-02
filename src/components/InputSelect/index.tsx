import Downshift from "downshift";
import { useCallback, useState } from "react";
import classNames from "classnames";
import {
  InputSelectOnChange,
  InputSelectProps
} from "./types";

export function InputSelect<TItem>({
  label,
  defaultValue,
  onChange: consumerOnChange,
  items,
  parseItem,
  isLoading,
  loadingLabel,
}: InputSelectProps<TItem>) {
  const [selectedValue, setSelectedValue] = useState<TItem | null>(defaultValue ?? null);

  const onChange = useCallback<InputSelectOnChange<TItem>>(
    (selectedItem) => {
      if (selectedItem === null) {
        return;
      }
      consumerOnChange(selectedItem);
      setSelectedValue(selectedItem);
    },
    [consumerOnChange]
  );

  return (
    <Downshift<TItem>
      id="RampSelect"
      onChange={onChange}
      selectedItem={selectedValue}
      itemToString={(item) => (item ? parseItem(item).label : "")}
    >
      {({
        getItemProps,
        getLabelProps,
        getMenuProps,
        isOpen,
        highlightedIndex,
        selectedItem,
        getToggleButtonProps,
        inputValue,
      }) => {
        const toggleProps = getToggleButtonProps();

        return (
          <div className="RampInputSelect--root" style={{ position: 'relative' }}>
            <label {...getLabelProps()}>{label}</label>
            <div className="RampBreak--xs" />
            <div
              className="RampInputSelect--input"
              onClick={toggleProps.onClick}
            >
              {inputValue}
            </div>
            <div
              className={classNames("RampInputSelect--dropdown-container", {
                "RampInputSelect--dropdown-container-opened": isOpen,
              })}
              {...getMenuProps()}
              style={{ position: 'absolute', width: '100%', zIndex: 1000 }}
            >
              {renderItems()}
            </div>
          </div>
        );

        function renderItems() {
          if (!isOpen) {
            return null;
          }

          if (isLoading) {
            return <div className="RampInputSelect--dropdown-item">{loadingLabel}...</div>;
          }

          if (items.length === 0) {
            return <div className="RampInputSelect--dropdown-item">No items</div>;
          }

          return items.map((item, index) => {
            const parsedItem = parseItem(item);
            return (
              <div
                key={parsedItem.value}
                {...getItemProps({
                  key: parsedItem.value,
                  index,
                  item,
                  className: classNames("RampInputSelect--dropdown-item", {
                    "RampInputSelect--dropdown-item-highlighted": highlightedIndex === index,
                    "RampInputSelect--dropdown-item-selected":
                      selectedItem && parseItem(selectedItem).value === parsedItem.value,
                  }),
                })}
              >
                {parsedItem.label}
              </div>
            );
          });
        }
      }}
    </Downshift>
  );
}
