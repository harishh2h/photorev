/** Shared Pill & Sage placeholder pattern for grid tiles. */
export const GRID_TILE_PLACEHOLDER_BG =
  'bg-[#EDF7F2] bg-[radial-gradient(circle_at_1px_1px,rgba(110,231,183,0.45)_1px,transparent_0)] bg-[length:14px_14px]'

/** Fills the justified layout slot; centers media inside. */
export const GRID_TILE_SHELL_CLASS =
  'relative flex h-full w-full min-h-0 items-center justify-center overflow-hidden'

/** Edge-to-edge fill for slot content. */
export const GRID_TILE_FILL_CLASS = 'absolute inset-0 overflow-hidden'

/** Image fills the layout box without cropping when aspect ratios match. */
export const GRID_TILE_IMAGE_CLASS = 'block h-full w-full object-contain'

export const GRID_TILE_HOVER_IMAGE_CLASS =
  'transition-transform duration-[380ms] ease-out group-hover:scale-[1.04]'

export const GRID_TILE_SHELL_BUTTON_CLASS =
  'relative block h-full w-full overflow-hidden cursor-pointer border-0 p-0 text-left outline-none transition-[box-shadow] duration-[380ms] ease-out focus-visible:outline-none focus-visible:shadow-focus'

export const GRID_TILE_SHELL_BUTTON_CENTERED_CLASS = `${GRID_TILE_SHELL_BUTTON_CLASS} ${GRID_TILE_SHELL_CLASS}`

export const GRID_TILE_PLACEHOLDER_SHELL_CLASS = `${GRID_TILE_PLACEHOLDER_BG}`

export const GRID_TILE_PENDING_SHELL_CLASS = `${GRID_TILE_PLACEHOLDER_SHELL_CLASS} flex items-center justify-center`

/** Outer chrome for a justified slot — border included in layout dimensions. */
export const GRID_TILE_ROOT_CLASS =
  'group relative box-border h-full w-full overflow-hidden rounded-sm border-[1.5px] border-base-300 bg-base-100 shadow-card transition-[box-shadow] duration-[380ms] ease-out hover:shadow-card-hover'
