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
export function buildGridLayoutFromQuestions(localQuestions = [], storedLayout = null, getQuestionType = (t) => t, isFollowUp = (q) => false) {
    const ROW_HEIGHT = 10;
    const MARGIN_Y = 20;
    const UNIT = ROW_HEIGHT + MARGIN_Y; // 30px per unit

    const calculateHeight = (q, type) => {
        if (!q) return 8;
        let px = 180; // base card height
        const titleLangs = Array.isArray(q.title) ? q.title.length : 1;
        px += (titleLangs - 1) * 44;

        const safeType = (type || '').toLowerCase();
        if (safeType === 'short_answer') {
            px += 50;
        } else if (safeType === 'paragraph') {
            px += 110;
        } else if (safeType === 'multiple_choice' || safeType === 'checkbox') {
            const choices = (q.config && Array.isArray(q.config.choices)) ? q.config.choices : [{}];
            px += choices.length * 48 + 45;
        } else if (safeType === 'rating') {
            px += 85;
        } else if (safeType === 'file_upload') {
            px += 140;
        } else if (safeType === 'title_description') {
            const descLangs = (q.config && Array.isArray(q.config.description)) ? q.config.description.length : 1;
            px += descLangs * 85;
        } else if (safeType === 'image') {
            px += 320;
        } else {
            px += 60;
        }

        return Math.max(5, Math.ceil((px + MARGIN_Y) / UNIT));
    };

    // determine order based on stored layout if available
    let orderedQuestions = [...(localQuestions || [])];
    if (Array.isArray(storedLayout) && storedLayout.length > 0) {
        const storedIds = new Set(storedLayout.map(s => String(s.i)));
        const allIdsPresent = orderedQuestions.every((q, idx) => storedIds.has(String(q && (q._id != null ? q._id : idx))));
        if (allIdsPresent) {
            const layoutOrder = storedLayout.slice().sort((a, b) => a.y - b.y).map(s => String(s.i));
            orderedQuestions.sort((a, b) => {
                const idA = String(a && (a._id != null ? a._id : ''));
                const idB = String(b && (b._id != null ? b._id : ''));
                return layoutOrder.indexOf(idA) - layoutOrder.indexOf(idB);
            });
        }
    }

    const l = [];
    let yCursor = 0;
    for (let i = 0; i < orderedQuestions.length; i++) {
        const q = orderedQuestions[i];
        const typeStr = getQuestionType(q && q.type);
        const h = calculateHeight(q, typeStr);
        const qId = String(q && (q._id != null ? q._id : i));
        l.push({ i: qId, x: 0, y: yCursor, w: 12, h });
        yCursor += h;
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
export async function onDragStop(newLayout = [], localQuestions = [], convertIdToStr = (v) => String(v), updateOrdersAndPersist = null) {
    if (!Array.isArray(newLayout) || !Array.isArray(localQuestions)) return localQuestions;
    const sorted = newLayout.slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const idOrder = sorted.map(s => String(s.i));
    const newQuestions = [];
    for (const id of idOrder) {
        const found = localQuestions.find(q => String(convertIdToStr(q && (q._id != null ? q._id : ''))) === id);
        if (found) newQuestions.push(found);
    }
    for (const q of localQuestions) if (!newQuestions.includes(q)) newQuestions.push(q);

    if (typeof updateOrdersAndPersist === 'function') {
        try {
            await updateOrdersAndPersist(newQuestions);
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
