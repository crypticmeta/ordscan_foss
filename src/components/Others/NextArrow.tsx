export default function NextArrow(props) {
  const { className, style, onClick } = props;

  return (
    <div
      onClick={onClick}
      style={{ zIndex: 200 }}
      // style={{ ...style }}
      className={
        "arrows next absolute top-0 bottom-[20%]  right-[-50px] lg:right-[-50px] z-50 flex cursor-pointer w-[150px] flex-col justify-center"
      }
    >
      <svg viewBox="0 0 130 130">
        <defs>
          <filter
            id="Ellipse_691"
            x="0"
            y="0"
            width="130"
            height="130"
            filterUnits="userSpaceOnUse"
          >
            <feOffset dy="12" in="SourceAlpha" />
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feFlood floodColor="#d82744" floodOpacity="0.502" />
            <feComposite operator="in" in2="blur" />
            <feComposite in="SourceGraphic" />
          </filter>
        </defs>
        <g id="Group_229" data-name="Group 229" transform="translate(45 33)">
          <g
            transform="matrix(1, 0, 0, 1, -45, -33)"
            filter="url(#Ellipse_691)"
          >
            <g
              id="Ellipse_691-2"
              data-name="Ellipse 691"
              transform="translate(45 33)"
              fill="#d82744"
              stroke="#d82744"
              strokeWidth="1"
            >
              <circle cx="20" cy="20" r="20" stroke="none" />
              <circle cx="20" cy="20" r="19.5" fill="none" />
            </g>
          </g>
          <path
            id="Icon_awesome-arrow-down"
            data-name="Icon awesome-arrow-down"
            d="M14.57,6.812l.794.794a.855.855,0,0,1,0,1.212L8.416,15.77a.855.855,0,0,1-1.212,0L.252,8.818a.855.855,0,0,1,0-1.212l.794-.794a.859.859,0,0,1,1.227.014l4.105,4.309V.858A.856.856,0,0,1,7.236,0H8.38a.856.856,0,0,1,.858.858V11.136l4.105-4.309A.853.853,0,0,1,14.57,6.812Z"
            transform="translate(12 27.616) rotate(-90)"
            fill="#fff"
          />
        </g>
      </svg>
    </div>
  );
}
