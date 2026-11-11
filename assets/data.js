/* Curriculum Bachelor Internationale Betriebswirtschaft, Hochschule Aalen (210 CP)
   Quelle: Studienverlaufsplan. Module lassen sich in der Website umbenennen und anpassen. */

// Hier steht, wo die Website liegt. Daraus wird der Stundenplan direkt von GitHub geladen.
window.REPO = { owner: 'Kiyo0711', name: 'ibw-studium', branch: 'main' };

window.FOCI = [
  { id: 'fact', name: 'Finance, Accounting, Controlling and Taxation' },
  { id: 'mkt', name: 'Marketing' },
  { id: 'hr', name: 'HR and Business Transformation' },
  { id: 'im', name: 'International Management' }
];

window.TYPES = {
  pflicht: 'Pflichtmodul',
  schwerpunkt: 'Schwerpunkt',
  wahl: 'Wahlpflichtmodul',
  praxis: 'Praxissemester',
  thesis: 'Abschlussarbeit'
};

// match: Stichworte, über die Termine aus dem Stundenplan dem Modul zugeordnet werden
window.CURRICULUM = [
  // 1. Semester
  { id: 'ibwl', sem: 1, cp: 5, type: 'pflicht', name: 'Einführung in die Internationale BWL', match: ['intern. bwl', 'internationale bwl'] },
  { id: 'marketing', sem: 1, cp: 5, type: 'pflicht', name: 'Marketing', match: [] },
  { id: 'wiss-arbeiten', sem: 1, cp: 5, type: 'pflicht', name: 'Wissenschaftliches Arbeiten', match: ['wissenschaftl'] },
  { id: 'intercultural', sem: 1, cp: 5, type: 'pflicht', name: 'Intercultural Management', match: ['intercultural'] },
  { id: 'wirtschaftsmathe', sem: 1, cp: 5, type: 'pflicht', name: 'Wirtschaftsmathematik', match: ['wirtschaftsmathematik'] },
  { id: 'english-1', sem: 1, cp: 5, type: 'pflicht', name: 'Business Englisch I', match: ['business english', 'business englisch i', 'toeic'] },
  // 2. Semester
  { id: 'scm', sem: 2, cp: 5, type: 'pflicht', name: 'Supply Chain Management', match: ['supply chain'] },
  { id: 'winfo', sem: 2, cp: 5, type: 'pflicht', name: 'Wirtschaftsinformatik', match: ['wirtschaftsinformatik'] },
  { id: 'privatrecht', sem: 2, cp: 5, type: 'pflicht', name: 'Wirtschaftsprivatrecht', match: ['privatrecht'] },
  { id: 'vwl', sem: 2, cp: 5, type: 'pflicht', name: 'Einführung in die VWL', match: ['vwl', 'volkswirtschaft'] },
  { id: 'buchfuehrung', sem: 2, cp: 5, type: 'pflicht', name: 'Buchführung und Bilanzierung', match: ['buchführung', 'bilanzierung'] },
  { id: 'english-2', sem: 2, cp: 5, type: 'pflicht', name: 'Business Englisch II', match: ['business english', 'business englisch ii', 'toeic'] },
  // 3. Semester
  { id: 'org-structure', sem: 3, cp: 5, type: 'pflicht', name: 'Organizational Structure', match: ['organizational'] },
  { id: 'steuern', sem: 3, cp: 5, type: 'pflicht', name: 'Unternehmensbesteuerung', match: ['besteuerung'] },
  { id: 'klr', sem: 3, cp: 5, type: 'pflicht', name: 'Kosten- und Leistungsrechnung', match: ['kosten- und leistung', 'kostenrechnung'] },
  { id: 'invfin', sem: 3, cp: 5, type: 'pflicht', name: 'Investition und Finanzierung', match: ['investition'] },
  { id: 'statistik', sem: 3, cp: 5, type: 'pflicht', name: 'Statistik für Wirtschaftswissenschaftler', match: ['statistik'] },
  { id: 'int-economics', sem: 3, cp: 5, type: 'pflicht', name: 'International Economics', match: ['international economics'] },
  // 4. Semester
  { id: 'schwerpunkt-1', sem: 4, cp: 10, type: 'schwerpunkt', name: 'Schwerpunkt (Teil 1)', match: [] },
  { id: 'personal', sem: 4, cp: 5, type: 'pflicht', name: 'Personalmanagement', match: ['personalmanagement'] },
  { id: 'projekt', sem: 4, cp: 5, type: 'pflicht', name: 'Projektmanagement', match: ['projektmanagement'] },
  { id: 'controlling', sem: 4, cp: 5, type: 'pflicht', name: 'Controlling', match: [] },
  { id: 'dbs', sem: 4, cp: 5, type: 'pflicht', name: 'Digital Business Systems', match: ['digital business'] },
  // 5. Semester
  { id: 'praxis', sem: 5, cp: 30, type: 'praxis', name: 'Praxissemester', match: ['praxissemester'] },
  // 6. Semester (kann als Auslandssemester absolviert werden)
  { id: 'schwerpunkt-2', sem: 6, cp: 15, type: 'schwerpunkt', name: 'Schwerpunkt (Teil 2)', match: [] },
  { id: 'leadership', sem: 6, cp: 5, type: 'pflicht', name: 'Leadership', match: ['leadership'] },
  { id: 'ethics', sem: 6, cp: 5, type: 'pflicht', name: 'Business Ethics and Corporate Governance', match: ['business ethics', 'corporate governance'] },
  { id: 'wahl-1', sem: 6, cp: 5, type: 'wahl', name: 'Wahlpflichtmodul', match: [] },
  // 7. Semester (kann als Auslandssemester absolviert werden)
  { id: 'schwerpunkt-3', sem: 7, cp: 5, type: 'schwerpunkt', name: 'Schwerpunkt (Teil 3)', match: [] },
  { id: 'strategic', sem: 7, cp: 5, type: 'pflicht', name: 'Strategic Management', match: ['strategic management'] },
  { id: 'thesis', sem: 7, cp: 12, type: 'thesis', name: 'Bachelorthesis', match: ['bachelor'] },
  { id: 'generale', sem: 7, cp: 3, type: 'wahl', name: 'Studium Generale', match: ['studium generale'] },
  { id: 'wahl-2', sem: 7, cp: 5, type: 'wahl', name: 'Wahlpflichtmodul', match: [] }
];

window.SEM_NOTES = {
  5: 'Praxissemester: 30 CP im Unternehmen.',
  6: 'Kann als Auslandssemester absolviert werden. Der Schwerpunkt (20 CP) läuft über das 6. und 7. Semester.',
  7: 'Kann als Auslandssemester absolviert werden. Der Schwerpunkt (20 CP) läuft über das 6. und 7. Semester.'
};

window.NOTE_TEMPLATES = {
  leer: { label: 'Leerer Lernzettel', body: '' },
  zusammenfassung: {
    label: 'Zusammenfassung',
    body: '# Thema\n\n## Das Wichtigste in 3 Sätzen\n\n\n## Kernbegriffe\n- **Begriff** – Erklärung\n\n## Zusammenhänge\n\n\n## Typische Klausurfragen\n- [ ] \n\n## Offene Fragen\n- '
  },
  formeln: {
    label: 'Formelsammlung',
    body: '# Formelsammlung\n\n## Kapitel 1\n\n`Formel = a + b`\nWofür: \nAchtung: \n\n## Kapitel 2\n'
  },
  karteikarten: {
    label: 'Karteikarten',
    body: '# Karteikarten\n\nJede Zeile mit zwei Doppelpunkten wird zu einer Karte: Frage :: Antwort\n\nWas bedeutet BWL? :: Betriebswirtschaftslehre\n'
  }
};
