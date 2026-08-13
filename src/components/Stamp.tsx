interface StampProps {
  value: number | string
  good?: boolean
  size?: number
}

export default function Stamp({ value, good = false, size = 64 }: StampProps) {
  return (
    <div
      className={`stamp ${good ? 'good' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.27 }}
    >
      {value}
      <span style={{ fontSize: 8, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.5px', marginTop: 2 }}>
        PCT
      </span>
    </div>
  )
}
