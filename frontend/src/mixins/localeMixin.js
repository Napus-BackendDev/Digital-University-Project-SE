import { mapGetters } from 'vuex';

export default {
    computed: {
        ...mapGetters('Setting', ['lang']),
    },
    methods: {
        getLang(data) {
            if (!data) return '';
            if (typeof data === 'string') return data;
            if (!Array.isArray(data)) return '';

            // This computed property 'lang' makes this method reactive to language changes
            const currentLang = this.lang.toLowerCase();
            let content = data.find(item => item.key && item.key.toLowerCase() === currentLang);

            // Fallback to 'en' if current locale not found
            if (!content) {
                content = data.find(item => item.key && item.key.toLowerCase() === 'en');
            }

            // Fallback to first available if 'en' not found
            if (!content && data.length > 0) {
                content = data[0];
            }

            return content ? content.value : '';
        }
    }
};
