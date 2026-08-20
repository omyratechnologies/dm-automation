interface SignalMarkProps {
  size?: number;
  className?: string;
  title?: string;
  idPrefix?: string;
}

/** Canonical Gemai ribbon mark. Keep static exports in /public/brand in sync. */
export function SignalMark({ size = 32, className, title, idPrefix = "gemai-signal" }: SignalMarkProps) {
  const outer = `outer-${idPrefix}`;
  const bar = `bar-${idPrefix}`;
  const arrow = `arrow-${idPrefix}`;
  const fold = `fold-${idPrefix}`;
  const clip = `clip-${idPrefix}`;
  const outerPath = "M1 279C-4 214 19 151 65 96C104 50 153 25 204 25H337C382 30 414 47 440 76C461 98 462 121 451 141C441 158 424 167 403 164C387 162 377 148 361 134C353 128 344 124 335 122H212C170 127 140 147 117 178C97 205 90 240 94 282C99 318 119 350 150 374C184 401 219 398 291 398C311 396 328 386 342 377L424 296L452 365C458 383 448 400 435 410C408 441 379 460 347 474C315 487 283 490 203 487C158 480 118 463 82 436C32 396 5 341 1 279Z";

  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={outer} x1="112" y1="42" x2="372" y2="486" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5367FF" />
          <stop offset="0.48" stopColor="#5665F4" />
          <stop offset="1" stopColor="#914AF7" />
        </linearGradient>
        <linearGradient id={bar} x1="247" y1="245" x2="407" y2="318" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6675FF" />
          <stop offset="1" stopColor="#5264F0" />
        </linearGradient>
        <linearGradient id={arrow} x1="391" y1="224" x2="472" y2="329" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9952FA" />
          <stop offset="1" stopColor="#8541F0" />
        </linearGradient>
        <linearGradient id={fold} x1="90" y1="115" x2="198" y2="446" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3148DA" stopOpacity="0.06" />
          <stop offset="0.52" stopColor="#3043D5" stopOpacity="0.82" />
          <stop offset="1" stopColor="#9C4EFF" stopOpacity="0.2" />
        </linearGradient>
        <clipPath id={clip}><path d={outerPath} /></clipPath>
      </defs>
      <path d={outerPath} fill={`url(#${outer})`} stroke="#4054EE" strokeWidth="1" />
      <path d="M112 129C66 194 54 289 83 365C99 407 129 442 174 466C118 406 99 350 112 292C128 221 172 170 231 140L112 129Z" fill={`url(#${fold})`} clipPath={`url(#${clip})`} />
      <path d="M84 365C105 417 143 451 193 474C160 439 147 402 151 355C132 327 116 292 112 255C83 295 73 330 84 365Z" fill="#8A4CF5" fillOpacity="0.52" clipPath={`url(#${clip})`} />
      <path d="M247 289C247 271 255 259 266 251C273 247 278 245 284 245H364C364 253 369 258 371 259L412 282L372 322H274C258 317 247 304 247 289Z" fill={`url(#${bar})`} stroke="#4054EE" strokeWidth="1" />
      <path d="M382 245C381 239 386 235 393 233L489 205C500 200 507 200 511 207C514 213 507 224 504 231L468 326C466 333 460 335 455 326L437 274L386 249C384 248 383 247 382 245Z" fill={`url(#${arrow})`} stroke="#5835D8" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}
