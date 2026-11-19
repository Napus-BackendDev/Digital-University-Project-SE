import { pickLocalizedText } from '@/projects/utils/analyticsWorkbook';

export default {
    computed: {
        lang() {
            const storeLang = this.$store && this.$store.getters && this.$store.getters['Setting/lang'];
            const i18nLang = this.$i18n && this.$i18n.locale;
            return storeLang || i18nLang || 'en';
        }
    },
    methods: {
        getLang(data) {
            return pickLocalizedText(data, this.lang);
        }
    }
};
