import { Slider, Stack, Tooltip } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { CgDanger } from "react-icons/cg";
function AmountSlider({ amount, balance, setAmount }) {
    
  const [mark, setMark] = useState([
    {
      value: 0,
      label: `0 sats`,
    },
    {
      value: amount,
      label: `${amount} sats`,
    },
  ]);
    
    useEffect(() => {
      setMark([
        {
          value: 0,
          label: `0 sats`,
        },
        {
          value: amount,
          label: `${amount} sats`,
        },
        {
          value: amount > 30000 ? 30000 : amount,
          label: `${amount > 30000 ? 30000 : amount} sats`,
        },
      ]);
    }, [amount])
    
  const handleChange = (event: Event, newValue: number | number[]) => {
    setAmount(newValue as number);
  };
  return (
    <div className="pt-5">
      <div className="center">
        <p className="text-xs text-center mr-2">
          {" "}
          Select Max Amount from to be used for padding (Approx)
        </p>
        <Tooltip
          title={
            amount < 6000
              ? "selected amount is low"
              : amount > balance - 10000
              ? "Max amount will be used to padd the inscription"
              : "You are overpaying amount"
          }
        >
          <div>
            {(amount < 6000 || balance>10000 && amount > balance - 10000) && (
              <CgDanger className="text-red-500" />
            )}
          </div>
        </Tooltip>
      </div>
      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        <Slider
          min={0}
          max={balance>30000?30000:balance}
          aria-label="Sats"
          value={amount}
          onChange={handleChange}
          valueLabelDisplay="auto"
          marks={mark}
        />
      </Stack>
    </div>
  );
}

export default AmountSlider;
