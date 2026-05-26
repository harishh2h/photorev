import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { decode } from 'blurhash'

const fallbackClass =
  'min-h-full w-full flex-1 bg-[#EDF7F2] bg-[radial-gradient(circle_at_1px_1px,rgba(110,231,183,0.45)_1px,transparent_0)] bg-[length:14px_14px]'

/**
 * @param {{ hash: string; className?: string; alt?: string }} props
 */
export default function BlurhashPlaceholder({ hash, className = '', alt = '' }) {
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof hash !== 'string' || hash.length < 6) {
      return undefined
    }
    const width = 32
    const height = 32
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return undefined
    }
    try {
      const pixels = decode(hash, width, height)
      const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height)
      ctx.putImageData(imageData, 0, 0)
    } catch {
      return undefined
    }
    return undefined
  }, [hash])

  if (typeof hash !== 'string' || hash.length < 6) {
    return <div className={`${fallbackClass} ${className}`.trim()} role="img" aria-label={alt} />
  }

  return (
    <canvas
      ref={canvasRef}
      className={`block h-full w-full object-cover ${className}`.trim()}
      aria-hidden={alt ? undefined : true}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
    />
  )
}

BlurhashPlaceholder.propTypes = {
  hash: PropTypes.string,
  className: PropTypes.string,
  alt: PropTypes.string,
}
