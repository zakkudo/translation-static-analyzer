const AboutPage = `
export default class AboutPage extends Component {
     static get title() {
         return __('About');
     }

    static get template() {
         return <div>{{__('Search')}} Welcome to the about page!</div>';

    }
};
`.trim();

const EmptyPage = ``.trim();

const SearchPage = `
export default class SearchPage extends Component {
     static get title() {
         return __('Search');
     }

    static get template() {
         return '{{__('invalid''string')}} {{__p('menuitem', 'Search')}} <div>{{__n('%d result', '%d results', 2)}}</div> {{__np('footer', '%d view', '%d views', 23)}}';
    }
};
`.trim();

const Application = `
export default class Application extends Component {
     static get title() {
         return __('Application');
     }
};
`.trim();

const EmptyKeysPage = `
export default class Application extends Component {
     static get title() {
         return __('') + __n('') + __np('') + __p('');
     }
};
`.trim();

module.exports = {
    'src/pages/Search/index.js': SearchPage,
    'src/pages/About/index.js': AboutPage,
    'src/pages/Empty/index.js': EmptyPage,
    'src/pages/EmptyKeys/index.js': EmptyKeysPage,
    'src/test.js': EmptyPage,
    'src/index.js': Application,
    './locales/existing.json': JSON.stringify({
        "Search": {"default": "検索"},
        "test unused key": {"default": "test value"},
        "Application": {"default": "アプリケーション"},
    }),
    'src/pages/About/.locales/existing.json': JSON.stringify({}),
    'src/pages/Search/.locales/existing.json': JSON.stringify({'Search': ''}),
};
