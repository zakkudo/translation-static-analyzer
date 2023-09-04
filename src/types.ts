/*
imsgid ""
msgstr ""
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"X-Generator: localizely.com\n"
"Last-Translator: localizely.com\n"
"Language-Team: localizely.com\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\n"
"Language: de\n"

msgid "Demo application"
msgstr "Demo-Anwendung"

#: polls/app.py:105
msgid "Welcome %s"
msgstr "Willkommen %s"

# Since we use 2 placeholders in this example, we marked them with numbers
# so it prints them properly in other languages, where their order maybe be switched
#. First placeholder is current user's name, second one is a name of message sender
msgid "Welcome back, %1$s! You have a new message from %2$s"
msgstr "Willkommen zurück, %1$s! Sie haben eine neue Nachricht von %2$s"

# This is a pluralized string. 
# It chooses one of the plural forms depending on passed parameter
msgid "You have %d new message" 
msgid_plural "You have %d new messages" 
msgstr[0] "Sie haben %d neue Nachricht" 
msgstr[1] "Sie haben %d neue Nachrichten"

# This text is written in two lines
#, fuzzy
msgid "We will guide you throughout the app\n"
"Please select your role:"
msgstr "Wir werden Sie durch die App führen\n"
"Bitte wählen Sie Ihre Rolle:"

# Don't forget, I want to remember something about this!
#~ msgid "My web page"
#~ msgstr "A minha página de web"
*/

type LocalizationItemSingular = {
  developerComments?: string;
  flags?: string[];
  msgctxt?: string;
  msgid: string;
  msgidPlural?: undefined;
  msgstr?: string;
  previous?: {
    msgid?: string;
    msgctxt?: string;
  };
  sourceReferences?: { filename: string; lineNumber: number }[];
  translatorComments?: string;
};

type LocalizationItemPlural = {
  developerComments?: string;
  flags?: string[];
  msgctxt?: string;
  msgid: string;
  msgidPlural: string;
  previous?: {
    msgid?: string;
    msgctxt?: string;
    msgidPlural?: string;
  };
  msgstr?: Record<string, string>;
  sourceReferences?: { filename: string; lineNumber: number }[];
  translatorComments?: string;
};

export type LocalizationItem =
  | LocalizationItemSingular
  | LocalizationItemPlural;
