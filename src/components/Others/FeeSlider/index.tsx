
import { Slider, Stack, Tooltip } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react'
import { recommendedFeeRate } from 'utils';
import { CgDanger } from "react-icons/cg";
function FeeSlider({ fee, setFee }) {
    const [current, setCurrent] = useState(0)
    const [mark, setMark] = useState([])
      const handleChange = (event: Event, newValue: number | number[]) => {
        setFee(newValue as number);
    };
    
    const getRecommendedFee = useCallback(
      async() => {
            const tempFee = await recommendedFeeRate()
            setFee(tempFee)
            setCurrent(tempFee)
            setMark([{value: tempFee, label: `${tempFee} sats/vB`}])
      },
      [setFee],
    )

    useEffect(() => {
      getRecommendedFee()
    }, []) 
  
  useEffect(() => {
    if(fee!=current)
    setMark([
      { value: current, label: `${current} sats/vB (recommended)` },
      { value: fee, label: `${fee} sats/vB` },
      { value: current+10, label: `${current+10} sats/vB` },
    ]);
    else {
      setMark([
        { value: current, label: `${current} sats/vB (recommended)` },
        { value: current + 10, label: `${current + 10} sats/vB` },
      ]);
    }
  }, [current, fee]);
    
    

  return (
    <div className="pt-5 pb-2">
      <div className="center">
        <p className="text-xs text-center mr-2">
          {" "}
         Approx Selected Fee Rate: {fee} sats/vB{" "}
        </p>
        <Tooltip
          title={
            fee < 7
              ? "Transaction might fail to confirm at this fee rate"
              : "You are overpaying fee"
          }
        >
          <div>
            {(fee > current + 10 || fee < 7) && (
              <CgDanger className="text-red-500" />
            )}
          </div>
        </Tooltip>
      </div>
      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        <Slider
          min={0}
          max={current + 10}
          aria-label="Fee"
          value={fee}
          onChange={handleChange}
          valueLabelDisplay="auto"
          marks={mark}
        />
      </Stack>
    </div>
  );
}

export default FeeSlider