import React from 'react'

const ChannelHashTag = ({ fill, width, height }) => {
  return (
    <>
    <svg width={width ? `${width}` : "14"} height={height ? `${height}` : "12"} viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.60666 12L3.08 9.33333H0.41333L0.646664 8H3.31333L4.02 4H1.35333L1.58666 2.66667H4.25333L4.72666 0H6.06L5.58666 2.66667H9.58666L10.06 0H11.3933L10.92 2.66667H13.5867L13.3533 4H10.6867L9.98 8H12.6467L12.4133 9.33333H9.74666L9.27333 12H7.94L8.41333 9.33333H4.41333L3.94 12H2.60666ZM5.35333 4L4.64666 8H8.64666L9.35333 4H5.35333Z" fill={(fill && fill !== '#ffffff') ? fill : "#333333"} />
    </svg>
    </>
  )
}

export default ChannelHashTag;