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
         return '{{__('invalid''string')}} <div>{{__n('%s result', '%s results', 2)}}</div>';

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

module.exports = {
    'src/pages/Search/index.js': SearchPage,
    'src/pages/About/index.js': AboutPage,
    'src/pages/Empty/index.js': EmptyPage,
    'src/test.js': EmptyPage,
    'src/index.js': Application,
    './locales/existing.json': JSON.stringify({
        "Search": "検索",
        "test unused key": "test value",
    }),
    'src/pages/About/.locales/existing.json': JSON.stringify({}),
    'src/pages/Search/.locales/existing.json': JSON.stringify({'Search': ''}),
};
