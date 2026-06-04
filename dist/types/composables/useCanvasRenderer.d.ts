/**
 * Creates a canvas renderer with DPR scaling and RAF-based redraw
 * @param {Object} props - component props with tv_id, width, height
 * @param {Function} getRenderer - function that returns the renderer instance
 * @returns {Object} canvas methods and state
 */
export function useCanvasRenderer(props: Object, getRenderer: Function): Object;
export default useCanvasRenderer;
