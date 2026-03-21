// Helper functions for draggable/grid layout handling
// Designed to be importable from Options API or Composition API code.

/**
 * Return a storage key for a given form object or id
 * @param {Object|String|Number|null} form
 */
export function getStorageKey(form) {
    const base = 'CoreUI-Vue-Draggable-Layouts';
    const id = form && form._id ? form._id : (typeof form === 'string' || typeof form === 'number' ? form : 'unsaved');
    return `${base}-${id}`;
}

/**
 * Load stored layout from localStorage for a form
 * @param {Object|String|Number|null} form
 * @returns {Array|null}
 */
export function loadStoredLayout(form) {
    try {
        const key = getStorageKey(form);
        const raw = localStorage.getItem(key) || null;
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Save gridLayout to localStorage for a form
 * @param {Object|String|Number|null} form
 * @param {Array} gridLayout
 */
export function saveGridLayout(form, gridLayout) {
    try {
        const key = getStorageKey(form);
        localStorage.setItem(key, JSON.stringify(gridLayout));
        return true;
    } catch (e) {
        console.error('saveGridLayout failed', e);
        return false;
    }
}

/**
 * Build a grid layout array from localQuestions.
 * Accepts a `getQuestionType` callback to read the effective type.
 * Returns an array of layout items { i, x, y, w, h }
 */
export function buildGridLayoutFromQuestions(localQuestions = [], storedLayout = null, getQuestionType = (t) => t) {
    const typeHeights = {
        short_answer: 13,
        paragraph: 15,
        multiple_choice: 17.5,
        checkbox: 17.5,
        rating: 13,
        file_upload: 17.5,
        title_description: 16.5,
        image: 52,
    };

    if (Array.isArray(storedLayout) && storedLayout.length > 0) {
        const storedIds = new Set(storedLayout.map(s => String(s.i)));
        const allIdsPresent = localQuestions.every((q, idx) => storedIds.has(String(q && (q._id || idx))));
        if (allIdsPresent) return JSON.parse(JSON.stringify(storedLayout));
    }

    const l = [];
    let yCursor = 0;
    for (let i = 0; i < localQuestions.length; i++) {
        const q = localQuestions[i];
        const type = (getQuestionType(q && q.type) || '').toLowerCase();
        const h = typeHeights[type] || 13;
        l.push({ i: String(q && (q._id != null ? q._id : i)), x: 0, y: yCursor, w: 12, h });
        yCursor += h + 1;
    }
    return l;
}

/**
 * Get layout item for a given question from gridLayout, or a default fallback
 */
export function getLayoutItem(gridLayout = [], question, qIndex) {
    const id = String(question && (question._id != null ? question._id : qIndex));
    const item = (gridLayout || []).find(x => String(x.i) === id);
    if (item) return item;
    return { i: id, x: 0, y: qIndex * 8, w: 12, h: 8 };
}

/**
 * Handle drag stop: reorder localQuestions according to newLayout ordering.
 * - newLayout: array provided by vue-grid-layout
 * - localQuestions: array (will be mutated or returned)
 * - convertIdToStr: function for comparing ids
 * - updateOrdersAndPersist: optional async function to call after reorder
 * Returns reordered array (or mutates and returns the provided one)
 */
export function onDragStop(newLayout = [], localQuestions = [], convertIdToStr = (v) => String(v), updateOrdersAndPersist = null) {
    if (!Array.isArray(newLayout) || !Array.isArray(localQuestions)) return localQuestions;
    const sorted = newLayout.slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const idOrder = sorted.map(s => String(s.i));
    const newQuestions = [];
    for (const id of idOrder) {
        const found = localQuestions.find(q => String(convertIdToStr(q && (q._id != null ? q._id : ''))) === id);
        if (found) newQuestions.push(found);
    }
    for (const q of localQuestions) if (!newQuestions.includes(q)) newQuestions.push(q);

    // if caller supplied an update function, call it (may be async)
    if (typeof updateOrdersAndPersist === 'function') {
        try {
            const res = updateOrdersAndPersist(newQuestions);
            // don't await here; caller can await if they want
        } catch (e) {
            console.error('updateOrdersAndPersist threw', e);
        }
    }

    return newQuestions;
}

export default {
    getStorageKey,
    loadStoredLayout,
    saveGridLayout,
    buildGridLayoutFromQuestions,
    getLayoutItem,
    onDragStop,
};
