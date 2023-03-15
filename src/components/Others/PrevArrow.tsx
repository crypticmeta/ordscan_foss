export default function SamplePrevArrow(props) {
  const { className, style, onClick } = props;

  return (
    <div
      onClick={onClick}
      style={{ zIndex: 200 }}
      // style={{ ...style }}
      className={
        "arrows prev absolute top-0 bottom-[20%]  left-[-50px] lg:left-[-50px] z-50 flex cursor-pointer w-[150px] flex-col justify-center"
      }
    >
      <svg viewBox="0 0 130 130" className="fill-brand_red">
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
        <g id="Group_228" data-name="Group 228" transform="translate(45 33)">
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
            d="M14.57,9.21l.794-.794a.855.855,0,0,0,0-1.212L8.416.252A.855.855,0,0,0,7.2.252L.252,7.2a.855.855,0,0,0,0,1.212l.794.794A.859.859,0,0,0,2.273,9.2L6.378,4.887V15.164a.856.856,0,0,0,.858.858H8.38a.856.856,0,0,0,.858-.858V4.887L13.344,9.2A.853.853,0,0,0,14.57,9.21Z"
            transform="translate(11.978 27.616) rotate(-90)"
            fill="#fff"
          />
        </g>
      </svg>
    </div>
  );
}
