/**
 * Localization dictionary and helpers for English and Bangla.
 * Designed for LandTech 2026 Land Record Discrepancy Screening (JomiTrace).
 */

export type Language = 'en' | 'bn';

export function normalizeReferenceLabel(label: string | null | undefined): string {
  if (!label) return '';
  return label.replace(/\b(Deed|Khatian|Mutation|DCR)\s+\1\s+/gi, '$1 ');
}

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Top Bar & Navigation
    app_title: 'JomiTrace',
    app_subtitle: 'Explainable land-record discrepancy screening',
    notice_synthetic: 'Fictional sample data for demonstration • LandTech 2026 track P3 & P5',
    rule_catalog_label: 'Rule catalog',
    ledger_tab: 'Investigation Ledger',
    workspace_tab: 'Case Workspace',
    rules_tab: 'Rules & Limitations',
    status_healthy: 'API Online',
    status_offline: 'API Offline',
    help_tour: 'Guided Tour',
    take_tour: 'Help',
    refresh_connection: 'Verify',
    connecting_backend: 'Connecting to backend...',
    api_healthy_detail: 'API healthy',
    api_offline_detail: 'API offline (Port 8000)',
    backend_error_title: 'Backend connection failed',
    backend_error_desc: 'Ensure the FastAPI backend is running locally on port 8000:',
    retry: 'Retry',

    // Operational Status
    operational_status: 'Operational Status',
    conflict_detected: 'Conflict detected',
    review_required: 'Review required',
    insufficient_info: 'Insufficient information',
    no_inconsistency: 'No inconsistency found',
    clean_status: 'No inconsistency found by these checks',
    status_draft: 'Draft',
    status_in_review: 'In review',
    status_report_ready: 'Report ready',
    status_archived: 'Archived',

    // Case Details & Headers
    case_code: 'Case ID',
    case_title: 'Title',
    district: 'District',
    upazila: 'Upazila',
    mouza: 'Mouza',
    jl_number: 'JL No.',
    provenance: 'Provenance',
    provenance_demo: 'Fictional demo',
    provenance_user_entered: 'User-entered',
    provenance_organizer: 'Organizer data',
    provenance_public: 'Public reference',
    filter_all_cases: 'All cases',
    filter_demo_cases: 'Demo scenarios',
    filter_entered_cases: 'Workspace cases',
    screened_count: 'Screened',
    needs_review_count: 'Needs review',
    review_findings: 'Review flagged findings',
    continue_review: 'Continue review',
    source_citation: 'Source citation',
    no_source_citation: 'No source record is available for this case-level result.',
    next_step_label: 'Next step',
    more_finding_details: 'Rule details and limitations',
    demo_report_notice: 'Fictional demonstration records; no real parties or parcels are represented.',
    entered_data_notice: 'User-entered records; values are not independently authenticated. Store and share with care.',
    report_disclaimer: 'JomiTrace is a screening prototype. Findings compare entered metadata and do not establish legal title, authenticity, or ownership.',
    rule_applied_label: 'Rule applied',
    comparison_scroll_hint: 'Swipe horizontally to compare more records',
    records_scroll_hint: 'Swipe horizontally to view all record details',
    ledger_scroll_hint: 'Swipe horizontally to view all case details',
    notes: 'Notes',
    last_updated: 'Last updated',
    record_count: 'Records',
    record_singular: 'record',
    status: 'Status',
    location: 'Location',
    actions: 'Action',
    location_not_specified: 'Location not specified',
    not_supplied: 'Not supplied',
    search_placeholder: 'Search by case code, title, district, mouza...',
    search: 'Search',
    clear: 'Clear',
    reset_filter: 'Reset status filter',
    draft_records: 'Draft Records',
    fictional_benchmarks: 'Fictional scenarios',
    fictional_desc: 'Test JomiTrace against canonical land-record discrepancies (S1–S8) covering duplicate transfers, chain gaps, and rapid resales.',
    scope_notice_title: 'LandTech 2026 Scope:',
    scope_notice_desc: 'Evaluates entered metadata against deterministic logic. Does not replace certified physical verification through authorized portals.',
    no_cases_found: 'No cases found',
    no_cases_desc_filtered: 'No cases match your active filters. Try clearing your search or resetting filters.',
    no_cases_desc_empty: 'Start an evidence-first verification by creating a new case or loading one of the 8 demonstration scenarios.',
    load_demo_scenario: 'Load Demo Scenario',

    // Common Actions
    create_case: 'Create case',
    open_case: 'Open case',
    delete_case: 'Delete case',
    run_checks: 'Run screening checks',
    rerun_checks: 'Re-run Checks',
    running_checks: 'Evaluating deterministic rules...',
    records_changed_stale: 'Records changed since last run. Run checks again to update findings.',
    inspect_evidence: 'Inspect evidence',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    archive: 'Archive',
    delete: 'Delete',
    load_scenario: 'Load fictional scenario',

    // Workspace Tabs
    tab_overview: 'Overview',
    tab_records: 'Source Records',
    tab_parties: 'Parties & Crosswalk',
    tab_findings: 'Findings',
    tab_timeline: 'Ownership Timeline',
    tab_comparison: 'Comparison Grid',
    tab_checklist: 'Checklist',
    tab_audit: 'Audit & Integrity',
    tab_report: 'Printable Report',
    more_tools: 'More tools',

    // Findings View
    screening_results: 'Deterministic Screening Results',
    filter_label: 'Filter:',
    filter_all: 'All',
    filter_conflicts: 'Conflicts',
    filter_review: 'Review Required',
    filter_insufficient: 'Insufficient Info',
    filter_consistent: 'No issue found',
    filter_not_applicable: 'Not assessed',
    no_issue_group: 'checks found no issue',
    limitations_near_status: 'These checks screen entered information only; they do not establish title or authenticate records.',
    conflict_count: 'Conflict detected',
    review_count: 'Review required',
    insufficient_count: 'Insufficient information',
    no_findings_filter: 'No findings match the selected status filter.',
    no_checks_yet_title: 'No checks executed for this case yet',
    no_checks_yet_desc: 'Run deterministic screening checks (JT-R01 through JT-R10) to evaluate plot references, area differences, chain continuity, duplicate transfers, and rapid resales.',
    observed_comparison: 'Observed Record Comparison',
    observation_context: 'Evidence and context',
    cited_records: 'Cited Records:',
    inspect_record_btn: 'Inspect',
    limitation_label: 'Limitation:',
    recommended_action: 'Recommended action:',
    rule_version_label: 'Rule v',
    hash_label: 'Hash',

    // Audit & Integrity
    audit_title: 'Audit Trail & Input Fingerprint',
    seal_intact: 'Input fingerprint matches',
    seal_mismatch: 'Input fingerprint differs',
    unsealed: 'No analysis snapshot',
    sealed_hash: 'Analysis input fingerprint (SHA-256)',
    current_hash: 'Current input fingerprint (SHA-256)',
    verify_live_seal: 'Refresh input comparison',
    checked_components: 'Components Evaluated',
    audit_events_count: 'Recorded Audit Events',
    action: 'Action',
    actor: 'Actor',
    audit_local_unverified: 'Local session (no login)',
    timestamp: 'Timestamp',
    details: 'Details',
    all_actions: 'All Actions',
    filter_by_action: 'Filter by action',
    non_judicial_notice: 'Non-judicial screening notice',
    report_comparison_matrix: 'Horizontal Pairwise Record Comparison',

    // Record Types (Required domain labels)
    deed: 'Deed (দলিল)',
    khatian: 'Khatian / Porcha (খতিয়ান / পর্চা)',
    mutation: 'Mutation (নামজারি)',
    dcr: 'DCR / Dakhila (ডিসিআর / দাখিলা)',
    survey_reference: 'Survey reference (মৌজা নকশা)',
    other: 'Other record',

    // Record Fields
    source_reference: 'Reference label',
    survey_series: 'Survey series',
    dag_no: 'Plot / Dag no. (দাগ নং)',
    khatian_no: 'Khatian no. (খতিয়ান নং)',
    deed_no: 'Deed no. (দলিল নং)',
    mutation_case_no: 'Mutation case no. (নামজারি কেস নং)',
    dcr_no: 'DCR no. (ডিসিআর নং)',
    record_date: 'Record date',
    registration_date: 'Registration date',
    area: 'Recorded area',
    area_unit: 'Area unit',
    decimal: 'Decimal / Shotok (শতাংশ)',
    acre: 'Acre (একর)',
    sqft: 'Square feet (বর্গফুট)',

    // Checklist
    checklist_title: 'External Manual Verification Checklist',
    checklist_notice: 'Completion represents reviewer manual verification; JomiTrace does not connect directly to government portals.',
    pending: 'Pending',
    completed: 'Completed by reviewer',
    not_applicable: 'Not applicable',
    reviewer_note: 'Reviewer note',

    // Report
    report_title: 'Land Record Discrepancy Screening Report',
    export_print: 'Print / Export PDF',
    allow_stale_warning: 'Exporting with un-assessed record changes',
    disclaimer_label: 'Screening limitations',

    // Footer & Credits
    footer_tagline: 'JomiTrace',
    footer_team: 'Team AN',
    footer_event: 'Daffodil International University',
    footer_mentor_industry: 'Industry Support Mentor',
    footer_mentor_faculty: 'Faculty Mentor',
    footer_disclaimer: 'This prototype supports land-record discrepancy screening and does not determine legal ownership.',
    footer_principles: 'Evidence-led screening · Deterministic rules · Human review required',

    // Guided Tour Steps
    tour_welcome_title: 'Welcome to JomiTrace',
    tour_welcome_desc: 'Explore how JomiTrace screens land-record inconsistencies, explains supporting evidence, and helps reviewers identify what needs further verification.',
    tour_start: 'Start Tour',
    tour_skip: 'Skip Tour',
    tour_next: 'Next',
    tour_back: 'Back',
    tour_finish: 'Finish',
    tour_dont_show: "Don't show again",
    tour_target_unavailable: 'This control is not on the current screen. Switch to the Investigation Ledger or open a case as needed; the tour will highlight it when it appears.',
    tour_step_short: 'Step',
    tour_step1_title: '1. Investigation Ledger',
    tour_step1_desc: 'Select and open an existing fictional case or load one of the 8 fictional scenarios to inspect example discrepancies.',
    tour_step2_title: '2. Fictional Scenarios',
    tour_step2_desc: 'Load one of eight synthetic scenarios to see how the deterministic checks surface common inconsistencies.',
    tour_step3_title: '3. Workspace Evidence & Comparison',
    tour_step3_desc: 'Use the workspace tabs to review findings, entered source records, and the pairwise comparison grid.',
    tour_step4_title: '4. Ownership Timeline',
    tour_step4_desc: 'Reconstruct chronological chain-of-custody transfer sequences and easily identify broken title links or unexplained sellers.',
    tour_step5_title: '5. Verification Checklist',
    tour_step5_desc: 'Track essential external checks (Sub-Registry, AC Land office, land development tax) to guide human field verification.',
    tour_step6_title: '6. Audit Trail & Input Fingerprint',
    tour_step6_desc: 'Review locally stored analysis and export activity, and compare the current input fingerprint with the analyzed run.',
    tour_step7_title: '7. Printable Report',
    tour_step7_desc: 'Export a screening report with findings, cited evidence, limitations, and a clear notice about the scope of these checks.',

    // Records View
    records_tab_title: 'Case Source Records',
    records_tab_desc: 'Land records entered for discrepancy screening. Changes automatically invalidate active runs.',
    timeline_notice_title: 'Timeline notice:',
    timeline_notice_desc: 'Shows the chronology of supplied records and transfers. It does not establish legal ownership or unrecorded rights.',
    node_findings: 'Node findings:',
    baseline_records: 'Baseline Records (Not Linked to Transfer Events)',
    add_record_btn: '+ Add Record',
    loading_records: 'Loading case source records...',
    no_records_title: 'No records entered for this case',
    no_records_desc: 'Add a khatian, registered deed, or mutation case to begin screening.',
    add_first_record: 'Add First Record',
    col_type: 'Type',
    col_reference: 'Reference',
    col_survey_plot: 'Survey & Plot',
    col_area: 'Area',
    col_parties: 'Parties (From → To)',
    col_dates: 'Dates',
    seller_label: 'Seller',
    buyer_label: 'Buyer',
    owner_label: 'Owner',
    owner_buyer_label: 'Owner / Buyer',
    reg_short: 'Reg',
    rec_short: 'Exec',
    edit: 'Edit',
    add_record_modal_title: 'Add Land Record Document',
    record_type_label: 'Record Type',
    ref_label: 'Reference Label',
    area_label: 'Numeric Area',
    seller_party_label: 'Seller Party',
    buyer_party_label: 'Buyer Party',
    owner_party_label: 'Owner / Beneficiary',
    select_party_placeholder: '(Select party)',
    saving: 'Saving...',
    update_record: 'Update Record',
    save_record: 'Save Record',
    delete_restricted_title: 'Deletion Restricted by Audit Citation',
    soft_archive_btn: 'Archive Record Instead',
    unspecified: '(Unspecified)',
    ref_required_error: 'Reference label is required.',

    // Comparison View
    loading_comparison: 'Generating comparison matrix...',
    error_comparison: 'Failed to load record comparison.',
    comparison_min_records: 'At least two source records are required to compare. Add more records in the Source Records tab.',
    comparison_matrix_label: 'Comparison matrix:',
    comparison_matrix_desc: 'Compares key metadata fields across all active documents. Mismatched entries are highlighted.',
    documents_compared: 'Documents Compared',
    compared_field: 'Compared Field',
    plot_reference_field: 'Plot reference (dag)',
    owner_seller_field: 'Owner / Seller reference',
    purchaser_beneficiary_field: 'Purchaser / Beneficiary reference',
    execution_registration_field: 'Registration date',

    // Audit View
    audit_header_desc: 'SHA-256 consistency check and locally stored activity history for case',
    audit_identity_notice: 'Activity history is stored locally; actor labels are not authenticated identities',
    verifying_seal: 'Verifying...',
    crypto_seal_title: 'Input fingerprint (SHA-256)',
    timezone_dhaka: 'Dhaka time (UTC+06:00)',
    run_id_label: 'Run ID',
    result: 'Result',
    audit_ledger_title: 'Activity & Audit Ledger',
    loading_audit: 'Loading audit events...',
    no_audit_events: 'No audit events match the selected filter.',
    sha256_digest_label: 'Deterministic SHA-256 canonical digest',
    error_label: 'Error',
    awaiting_integrity: 'Awaiting integrity evaluation.',
    no_seal_yet: 'No analysis run has sealed this case',
    calculating_hash: 'Calculating live hash...',
    total_events: 'total events',

    // Report View
    loading_report: 'Preparing screening report...',
    stale_run_warning: 'Stale Analysis — Re-run Required',
    stale_run_desc: 'Records have been modified since the last rule-engine run. Re-run verification checks to maintain audit integrity.',
    export_stale_anyway: 'Export Stale Report Anyway',
    report_error_title: 'Unable to Generate Report',
    report_error_desc: 'An error occurred while preparing the report.',
    stale_snapshot: 'Stale Snapshot',
    sealed_snapshot: 'Analysis snapshot current',
    report_dossier_label: 'Screening Report',
    screening_summary: 'Screening summary',
    short_report_notice: 'This report screens entered information only. No official system was queried; it does not establish ownership or document authenticity.',
    full_limitations: 'Screening limitations and notice',
    as_of_date: 'As of date',
    reviewer: 'Reviewer',
    timezone_label: 'Timezone',
    configuration_label: 'Configuration (area tolerance · rapid transfer · mutation reference)',
    parties_crosswalk_report: 'Parties and plot crosswalk status',
    parties: 'Parties',
    aliases: 'Aliases',
    confirmed: 'confirmed',
    unconfirmed: 'unconfirmed',
    no_parties: 'No case parties entered.',
    crosswalk_status: 'Crosswalks',
    no_crosswalks: 'No crosswalks entered.',
    mismatch: 'Mismatch',
    findings: 'findings',
    fictional_scenario: 'Fictional scenario',
    report_h1: 'JomiTrace Screening Report',
    sample_data_label: 'Sample Data',
    input_hash_label: 'Input State Hash',
    intact_matched: 'Matches analysis snapshot',
    mismatch_altered: 'Differs from analysis snapshot',
    unsealed_label: 'UNSEALED',
    landtech_eval_label: 'LandTech 2026 Evaluation',
    report_section1: 'Source Documents Reviewed',
    report_section2: 'Horizontal Record Comparison Grid',
    evaluated_attr: 'Evaluated Attribute',
    consistency: 'Consistency',
    report_section3: 'Discrepancy Findings',
    no_findings_report: 'No findings generated.',
    cited_evidence: 'Cited Evidence',
    followup_label: 'Follow-up',
    report_section4: 'Ownership Transfer Timeline',
    date_col: 'Date',
    transfer_col: 'Transfer',
    from_party_col: 'From Party',
    to_party_col: 'To Party',
    plot_area_col: 'Plot & Area',
    document_col: 'Document',
    report_section5: 'External Verification Checklist',
    note_label: 'Note',
    report_section6: 'Audit Trail Summary',
    activity_context: 'Activity Context',
    report_section7: 'Screening Rules Executed',
    dossier_ref: 'Run ID',

    // Parties & Crosswalk View
    parties_tab_title: 'Confirmed Party Identities & Plot Crosswalks',
    parties_tab_desc: 'Standardized party identities across documents and verified survey series plot crosswalks.',
    create_party_btn: '+ Create Party Identity',
    loading_parties: 'Loading party identities and crosswalk mappings...',
    no_parties_msg: 'No party identities confirmed yet. Create party tags (e.g. Party P1) to map deeds and khatians.',
    col_canonical_label: 'Canonical Label',
    col_linked_aliases: 'Linked Name Variations (Aliases)',
    no_aliases_msg: 'No alias strings linked',
    add_alias_btn: '+ Add Alias',
    crosswalk_section_title: 'Confirmed Plot Crosswalks (CS / SA / RS / BS)',
    crosswalk_section_desc: 'Explicit mapping between plots across survey series to enable deterministic screening without false positives.',
    add_crosswalk_btn: '+ Add Crosswalk Mapping',
    loading_crosswalk: 'Loading plot crosswalks...',
    no_crosswalk_msg: 'No crosswalk mappings registered. Add mappings if deeds refer to differing survey series.',
    col_survey_a: 'Source Survey & Dag',
    col_survey_b: 'Corresponding Survey & Dag',
    col_basis_note: 'Verification Basis',
    col_review_status: 'Review Status',
    status_confirmed: 'Confirmed',
    status_unconfirmed: 'Unconfirmed',
    no_note_recorded: 'No note recorded',
    confirm_action: 'Confirm',
    confirming: 'Confirming...',
    edit_party_modal: 'Add Alias for Party',
    create_party_modal: 'Create Canonical Party Identity',
    party_label_input: 'Party Label (e.g. Party P1 - Seller)',
    aliases_input: 'Initial Name Variations (comma-separated)',
    alias_text_input: 'Name Variation / Alias String',
    create_crosswalk_modal: 'Add Confirmed Plot Crosswalk Mapping',
    basis_note_placeholder: 'e.g. Verified against Mauza Map sheet or RS Khatian note',
    confirmed_by_reviewer_label: 'Mark as confirmed by reviewer (enables deterministic matching)',
  },
  bn: {
    // Top Bar & Navigation
    app_title: 'জমিট্রেস',
    app_subtitle: 'ভূমির নথির অসংগতি শনাক্তে ব্যাখ্যাযোগ্য সহায়তা',
    notice_synthetic: 'প্রদর্শনের জন্য কাল্পনিক নমুনা তথ্য • ল্যান্ডটেক ২০২৬ ট্র্যাক পি৩ ও পি৫',
    rule_catalog_label: 'নিয়মাবলী তালিকা',
    ledger_tab: 'তদন্ত লেজার',
    workspace_tab: 'কেস ওয়ার্কস্পেস',
    rules_tab: 'নিয়মাবলী ও সীমাবদ্ধতা',
    status_healthy: 'সার্ভার সচল',
    status_offline: 'সার্ভার অফলাইন',
    help_tour: 'নির্দেশিকা সফর',
    take_tour: 'সাহায্য',
    refresh_connection: 'যাচাই',
    connecting_backend: 'সার্ভারের সাথে সংযোগ স্থাপন করা হচ্ছে...',
    api_healthy_detail: 'সার্ভার সচল',
    api_offline_detail: 'সার্ভার অফলাইন (পোর্ট ৮০০০)',
    backend_error_title: 'সার্ভার সংযোগ ব্যর্থ হয়েছে',
    backend_error_desc: 'নিশ্চিত করুন যে FastAPI ব্যাকএন্ড স্থানীয়ভাবে পোর্ট ৮০০০-এ চালু রয়েছে:',
    retry: 'পুনরায় চেষ্টা',

    // Operational Status
    operational_status: 'পর্যবেক্ষণ অবস্থা',
    conflict_detected: 'অসঙ্গতি শনাক্ত হয়েছে',
    review_required: 'পর্যালোচনা প্রয়োজন',
    insufficient_info: 'অপর্যাপ্ত তথ্য',
    no_inconsistency: 'কোনো অসঙ্গতি পাওয়া যায়নি',
    clean_status: 'এই যাচাইয়ে কোনো অসঙ্গতি পাওয়া যায়নি',
    status_draft: 'খসড়া রেকর্ড',
    status_in_review: 'পর্যালোচনাধীন',
    status_report_ready: 'প্রতিবেদন প্রস্তুত',
    status_archived: 'আর্কাইভকৃত',

    // Case Details & Headers
    case_code: 'কেস নম্বর',
    case_title: 'শিরোনাম',
    district: 'জেলা',
    upazila: 'উপজেলা',
    mouza: 'মৌজা',
    jl_number: 'জে.এল. নং',
    provenance: 'উৎস ধরন',
    provenance_demo: 'কাল্পনিক ডেমো',
    provenance_user_entered: 'ব্যবহারকারীর দেওয়া তথ্য',
    provenance_organizer: 'আয়োজকের তথ্য',
    provenance_public: 'প্রকাশ্য রেফারেন্স',
    filter_all_cases: 'সকল কেস',
    filter_demo_cases: 'ডেমো পরিস্থিতি',
    filter_entered_cases: 'কর্মক্ষেত্রের কেস',
    screened_count: 'পরীক্ষিত ফলাফল',
    needs_review_count: 'পর্যালোচনা প্রয়োজন',
    review_findings: 'চিহ্নিত ফলাফল পর্যালোচনা করুন',
    continue_review: 'পর্যালোচনা চালিয়ে যান',
    source_citation: 'উৎস নথি',
    no_source_citation: 'এই কেস-স্তরের ফলাফলের জন্য কোনো উৎস নথি নেই।',
    next_step_label: 'পরবর্তী পদক্ষেপ',
    more_finding_details: 'নিয়মের বিস্তারিত ও সীমাবদ্ধতা',
    demo_report_notice: 'কাল্পনিক প্রদর্শনী নথি; কোনো বাস্তব ব্যক্তি বা জমিকে উপস্থাপন করে না।',
    entered_data_notice: 'ব্যবহারকারীর দেওয়া নথি; তথ্যের সত্যতা স্বাধীনভাবে যাচাই করা হয়নি। সতর্কতার সঙ্গে সংরক্ষণ ও শেয়ার করুন।',
    report_disclaimer: 'জমিট্রেস একটি প্রাথমিক যাচাই প্রোটোটাইপ। প্রদত্ত তথ্যের অসঙ্গতি চিহ্নিত করে; আইনি মালিকানা বা নথির সত্যতা নির্ধারণ করে না।',
    rule_applied_label: 'প্রয়োগ করা নিয়ম',
    comparison_scroll_hint: 'আরও নথি তুলনা করতে পাশে স্ক্রল করুন',
    records_scroll_hint: 'সব নথির তথ্য দেখতে পাশে স্ক্রল করুন',
    ledger_scroll_hint: 'সব কেসের তথ্য দেখতে পাশে স্ক্রল করুন',
    notes: 'মন্তব্য',
    last_updated: 'সর্বশেষ পরিবর্তন',
    record_count: 'নথিপত্র',
    record_singular: 'টি নথি',
    status: 'অবস্থা',
    location: 'এলাকা',
    actions: 'পদক্ষেপ',
    location_not_specified: 'ঠিকানা উল্লেখ নেই',
    not_supplied: 'সরবরাহ করা হয়নি',
    search_placeholder: 'কেস কোড, শিরোনাম, জেলা বা মৌজা দিয়ে খুঁজুন...',
    search: 'অনুসন্ধান',
    clear: 'মুছুন',
    reset_filter: 'ফিল্টার বাতিল করুন',
    draft_records: 'খসড়া রেকর্ডসমূহ',
    fictional_benchmarks: 'কাল্পনিক সিনারিও',
    fictional_desc: 'একই জমির দ্বৈত হস্তান্তর, শৃঙ্খল বিচ্ছিন্নতা এবং দ্রুত বিক্রয়ের মতো জটিল অসঙ্গতিগুলো S1–S8 কাল্পনিক নমুনার মাধ্যমে পরীক্ষা করুন।',
    scope_notice_title: 'ল্যান্ডটেক ২০২৬ পরিধি:',
    scope_notice_desc: 'প্রদত্ত তথ্যসমূহ সুনির্দিষ্ট নিয়মে যাচাই করে। এটি সরকারি মূল নথিপত্র বা মাঠপর্যায়ের সরেজমিন তদন্তের বিকল্প নয়।',
    no_cases_found: 'কোনো কেস পাওয়া যায়নি',
    no_cases_desc_filtered: 'আপনার সক্রিয় ফিল্টারের সাথে কোনো কেস মিলছে না। ফিল্টার পরিবর্তন করে চেষ্টা করুন।',
    no_cases_desc_empty: 'নতুন কেস তৈরি করে বা ৮টি ডেমো কেসের যেকোনো একটি লোড করে যাচাই প্রক্রিয়া শুরু করুন।',
    load_demo_scenario: 'কাল্পনিক ডেমো কেস লোড',

    // Common Actions
    create_case: 'নতুন কেস তৈরি',
    open_case: 'কেস খুলুন',
    delete_case: 'কেস মুছুন',
    run_checks: 'স্ক্রিনিং পরীক্ষা চালান',
    rerun_checks: 'পুনরায় স্ক্রিনিং চালান',
    running_checks: 'নিয়ম পরীক্ষা চলছে...',
    records_changed_stale: 'সর্বশেষ পরীক্ষার পর রেকর্ড পরিবর্তন হয়েছে। ফলাফল হালনাগাদ করতে পুনরায় যাচাই চালান।',
    inspect_evidence: 'প্রমাণ পরীক্ষা করুন',
    close: 'বন্ধ করুন',
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    confirm: 'নিশ্চিত করুন',
    archive: 'আর্কাইভ',
    delete: 'মুছুন',
    load_scenario: 'কাল্পনিক ডেমো কেস লোড করুন',

    // Workspace Tabs
    tab_overview: 'সারসংক্ষেপ',
    tab_records: 'মূল নথিপত্র',
    tab_parties: 'পক্ষ ও দাগ ক্রশওয়াক',
    tab_findings: 'শনাক্তকৃত ফলাফল',
    tab_timeline: 'মালিকানা সময়রেখা',
    tab_comparison: 'রেকর্ড তুলনা গ্রিড',
    tab_checklist: 'যাচাই চেকলিস্ট',
    tab_audit: 'অডিট ও সিল নিরাপত্তা',
    tab_report: 'মুদ্রণযোগ্য প্রতিবেদন',
    more_tools: 'অন্যান্য সরঞ্জাম',

    // Findings View
    screening_results: 'সুনির্দিষ্ট নিয়মভিত্তিক পরীক্ষার ফলাফল',
    filter_label: 'ফিল্টার:',
    filter_all: 'সকল',
    filter_conflicts: 'অসঙ্গতি',
    filter_review: 'পর্যালোচনা প্রয়োজন',
    filter_insufficient: 'অপর্যাপ্ত তথ্য',
    filter_consistent: 'কোনো সমস্যা পাওয়া যায়নি',
    filter_not_applicable: 'পরীক্ষা করা যায়নি',
    no_issue_group: 'টি পরীক্ষায় কোনো সমস্যা পাওয়া যায়নি',
    limitations_near_status: 'এই পরীক্ষাগুলো দেওয়া তথ্য যাচাই করে; মালিকানা বা নথির সত্যতা নিশ্চিত করে না।',
    conflict_count: 'অসঙ্গতি শনাক্ত হয়েছে',
    review_count: 'পর্যালোচনা প্রয়োজন',
    insufficient_count: 'অপর্যাপ্ত তথ্য',
    no_findings_filter: 'নির্বাচিত ফিল্টারের সাথে কোনো ফলাফল মিলছে না।',
    no_checks_yet_title: 'এই কেসে এখনো কোনো পরীক্ষা চালানো হয়নি',
    no_checks_yet_desc: 'দাগ নম্বর, জমির পরিমাণ, মালিকানার ধারাবাহিকতা এবং দ্রুত হস্তান্তর মূল্যায়নে সুনির্দিষ্ট যাচাই পরীক্ষা (JT-R01 থেকে JT-R10) চালান।',
    observed_comparison: 'পর্যবেক্ষিত রেকর্ড তুলনা',
    observation_context: 'প্রমাণ ও প্রেক্ষাপট',
    cited_records: 'উদ্ধৃত নথিপত্র:',
    inspect_record_btn: 'পরীক্ষা করুন',
    limitation_label: 'সীমাবদ্ধতা:',
    recommended_action: 'প্রস্তাবিত পদক্ষেপ:',
    rule_version_label: 'নিয়ম সংস্করণ ',
    hash_label: 'হ্যাশ',

    // Audit & Integrity
    audit_title: 'অডিট ট্রেইল ও ইনপুট ফিঙ্গারপ্রিন্ট',
    seal_intact: 'ইনপুট ফিঙ্গারপ্রিন্ট মিলে গেছে',
    seal_mismatch: 'ইনপুট ফিঙ্গারপ্রিন্টে অমিল',
    unsealed: 'বিশ্লেষণ স্ন্যাপশট নেই',
    sealed_hash: 'বিশ্লেষণ ইনপুট ফিঙ্গারপ্রিন্ট (SHA-256)',
    current_hash: 'বর্তমান ইনপুট ফিঙ্গারপ্রিন্ট (SHA-256)',
    verify_live_seal: 'ইনপুট তুলনা হালনাগাদ করুন',
    checked_components: 'যাচাইকৃত উপাদানসমূহ',
    audit_events_count: 'রেকর্ডকৃত অডিট ইভেন্ট',
    action: 'পদক্ষেপ',
    actor: 'ব্যবহারকারী / পর্যালোচক',
    audit_local_unverified: 'স্থানীয় সেশন (লগইন নেই)',
    timestamp: 'সময়',
    details: 'বিস্তারিত বিবরণ',
    all_actions: 'সকল পদক্ষেপ',
    filter_by_action: 'পদক্ষেপ ফিল্টার করুন',
    non_judicial_notice: 'অনানুষ্ঠানিক প্রাথমিক নিরীক্ষা সতর্কতা',
    report_comparison_matrix: 'পাশাপাশি রেকর্ড তুলনা মেট্রিক্স',

    // Record Types
    deed: 'দলিল',
    khatian: 'খতিয়ান / পর্চা',
    mutation: 'নামজারি',
    dcr: 'দাখিলা / ডিসিআর',
    survey_reference: 'মৌজা নকশা রেফারেন্স',
    other: 'অন্যান্য নথি',

    // Record Fields
    source_reference: 'নথির রেফারেন্স',
    survey_series: 'জরিপ শ্রেণি',
    dag_no: 'দাগ নং',
    khatian_no: 'খতিয়ান নং',
    deed_no: 'দলিল নং',
    mutation_case_no: 'নামজারি কেস নং',
    dcr_no: 'ডিসিআর নং',
    record_date: 'সম্পাদন তারিখ',
    registration_date: 'নিবন্ধন তারিখ',
    area: 'রেকর্ডকৃত পরিমাণ',
    area_unit: 'পরিমাপ একক',
    decimal: 'শতাংশ',
    acre: 'একর',
    sqft: 'বর্গফুট',

    // Checklist
    checklist_title: 'বাহ্যিক মাঠপর্যায়ের যাচাই চেকলিস্ট',
    checklist_notice: 'চেকলিস্ট সম্পন্ন করা মানে পর্যালোচক নিজে যাচাই করেছেন; জমিট্রেস সরাসরি সরকারি পোর্টালে যুক্ত নয়।',
    pending: 'অপেক্ষমাণ',
    completed: 'পর্যালোচক কর্তৃক যাচাইকৃত',
    not_applicable: 'প্রযোজ্য নয়',
    reviewer_note: 'পর্যালোচকের মন্তব্য',

    // Report
    report_title: 'ভূমি রেকর্ড অসঙ্গতি নিরীক্ষা প্রতিবেদন',
    export_print: 'প্রিন্ট / পিডিএফ ডাউনলোড',
    allow_stale_warning: 'অ-হালনাগাদ রেকর্ড নিয়ে রিপোর্ট তৈরি করা হচ্ছে',
    disclaimer_label: 'আইনি সীমাবদ্ধতা ও সতর্কতা',

    // Footer & Credits
    footer_tagline: 'জমিট্রেস',
    footer_team: 'টিম AN',
    footer_event: 'Daffodil International University',
    footer_mentor_industry: 'শিল্প সহায়তা পরামর্শক',
    footer_mentor_faculty: 'ফ্যাকাল্টি মেন্টর',
    footer_disclaimer: 'এই প্রোটোটাইপ জমির নথির অসংগতি শনাক্তে সহায়তা করে; আইনি মালিকানা নির্ধারণ করে না।',
    footer_principles: 'প্রমাণভিত্তিক স্ক্রিনিং · নির্ধারিত নিয়ম · মানবিক পর্যালোচনা প্রয়োজন',

    // Guided Tour Steps
    tour_welcome_title: 'জমিট্রেস-এ স্বাগতম',
    tour_welcome_desc: 'কীভাবে জমিট্রেস ভূমির রেকর্ডের অসঙ্গতি যাচাই করে, প্রমাণ ব্যাখ্যা করে এবং প্রয়োজনীয় যাচাইযোগ্য বিষয়গুলো চিহ্নিত করে তা জানুন।',
    tour_start: 'ট্যুর শুরু করুন',
    tour_skip: 'এড়িয়ে যান',
    tour_next: 'পরবর্তী',
    tour_back: 'পূর্ববর্তী',
    tour_finish: 'সম্পন্ন',
    tour_dont_show: 'আর দেখাবেন না',
    tour_target_unavailable: 'বর্তমান পর্দায় এই নিয়ন্ত্রণটি নেই। প্রয়োজনমতো তদন্ত লেজারে ফিরুন বা একটি কেস খুলুন; নিয়ন্ত্রণটি দেখা গেলে ট্যুর সেটি চিহ্নিত করবে।',
    tour_step_short: 'ধাপ',
    tour_step1_title: '১. তদন্ত লেজার',
    tour_step1_desc: 'একটি কাল্পনিক কেস নির্বাচন করুন অথবা উদাহরণ হিসেবে আটটি কাল্পনিক সিনারিওর একটি লোড করুন।',
    tour_step2_title: '২. কাল্পনিক সিনারিও',
    tour_step2_desc: 'সুনির্দিষ্ট যাচাই কীভাবে সাধারণ অসঙ্গতি চিহ্নিত করে তা দেখতে আটটি কাল্পনিক সিনারিওর একটি লোড করুন।',
    tour_step3_title: '৩. কর্মক্ষেত্রের প্রমাণ ও তুলনা',
    tour_step3_desc: 'কর্মক্ষেত্রের ট্যাব থেকে যাচাইয়ের ফলাফল, যুক্ত করা মূল নথি এবং পাশাপাশি তুলনা গ্রিড দেখুন।',
    tour_step4_title: '৪. মালিকানা সময়রেখা',
    tour_step4_desc: 'পরম্পরাগত মালিকানা হস্তান্তরের কালানুক্রমিক ধারা পর্যবেক্ষণ করুন এবং শৃঙ্খল বিচ্ছিন্নতা বা অননুমোদিত বিক্রেতা সহজে শনাক্ত করুন।',
    tour_step5_title: '৫. মাঠপর্যায়ের যাচাই চেকলিস্ট',
    tour_step5_desc: 'মাঠপর্যায়ে ও সংশ্লিষ্ট দপ্তরে (সাব-রেজিস্ট্রি, এসি ল্যান্ড অফিস, ভূমি উন্নয়ন কর) প্রয়োজনীয় বাহ্যিক অনুসন্ধান চেকলিস্টের মাধ্যমে পর্যবেক্ষণ করুন।',
    tour_step6_title: '৬. অডিট ট্রেইল ও ইনপুট ফিঙ্গারপ্রিন্ট',
    tour_step6_desc: 'স্থানীয়ভাবে সংরক্ষিত বিশ্লেষণ ও রপ্তানি কার্যক্রম দেখুন এবং বর্তমান ইনপুট ফিঙ্গারপ্রিন্টের সঙ্গে বিশ্লেষিত তথ্য তুলনা করুন।',
    tour_step7_title: '৭. মুদ্রণযোগ্য প্রতিবেদন',
    tour_step7_desc: 'সকল শনাক্তকৃত ফলাফল, উদ্ধৃত প্রমাণ, সীমাবদ্ধতা ও আইনি সতর্কবার্তাসহ একটি সম্পূর্ণ মুদ্রণযোগ্য নিরীক্ষা প্রতিবেদন তৈরি করুন।',

    // Records View
    records_tab_title: 'কেসের মূল নথিপত্র',
    records_tab_desc: 'অসঙ্গতি স্ক্রিনিংয়ের জন্য এখানে ভূমি নথি যোগ করুন। কোনো পরিবর্তন হলে আগের বিশ্লেষণটি স্বয়ংক্রিয়ভাবে অকার্যকর হয়।',
    timeline_notice_title: 'সময়রেখার সতর্কতা:',
    timeline_notice_desc: 'সরবরাহকৃত নথি ও হস্তান্তরের কালানুক্রমিক ধারা দেখায়। এটি আইনি মালিকানা বা অনথিভুক্ত অধিকার নিশ্চিত করে না।',
    node_findings: 'এই ধাপের ফলাফল:',
    baseline_records: 'ভিত্তি নথি (হস্তান্তর ইভেন্টের সঙ্গে যুক্ত নয়)',
    add_record_btn: '+ নথি যুক্ত করুন',
    loading_records: 'মূল নথিপত্র লোড হচ্ছে...',
    no_records_title: 'এই কেসে কোনো নথি যুক্ত করা হয়নি',
    no_records_desc: 'নিরীক্ষা শুরু করতে একটি খতিয়ান, নিবন্ধিত দলিল বা নামজারি যুক্ত করুন।',
    add_first_record: 'প্রথম নথি যুক্ত করুন',
    col_type: 'ধরন',
    col_reference: 'রেফারেন্স',
    col_survey_plot: 'জরিপ ও দাগ',
    col_area: 'পরিমাণ',
    col_parties: 'পক্ষ (বিক্রেতা → ক্রেতা)',
    col_dates: 'তারিখ',
    seller_label: 'বিক্রেতা',
    buyer_label: 'ক্রেতা',
    owner_label: 'মালিক',
    owner_buyer_label: 'মালিক / ক্রেতা',
    reg_short: 'নিব',
    rec_short: 'সম্পাদন',
    edit: 'সম্পাদনা',
    add_record_modal_title: 'ভূমি নথি যুক্ত করুন',
    record_type_label: 'নথির ধরন',
    ref_label: 'রেফারেন্স লেবেল',
    area_label: 'সংখ্যাসূচক পরিমাণ',
    seller_party_label: 'বিক্রেতা পক্ষ',
    buyer_party_label: 'ক্রেতা পক্ষ',
    owner_party_label: 'মালিক / সুবিধাভোগী',
    select_party_placeholder: '(পক্ষ নির্বাচন করুন)',
    saving: 'সংরক্ষণ হচ্ছে...',
    update_record: 'নথি হালনাগাদ করুন',
    save_record: 'নথি সংরক্ষণ করুন',
    delete_restricted_title: 'অডিট উদ্ধৃতির কারণে মুছে ফেলা সীমাবদ্ধ',
    soft_archive_btn: 'নথি আর্কাইভ করুন',
    unspecified: '(অনির্দিষ্ট)',
    ref_required_error: 'রেফারেন্স লেবেল আবশ্যক।',

    // Comparison View
    loading_comparison: 'তুলনা মেট্রিক্স তৈরি হচ্ছে...',
    error_comparison: 'রেকর্ড তুলনা লোড করতে সমস্যা হয়েছে।',
    comparison_min_records: 'তুলনা করতে কমপক্ষে দুটি নথি প্রয়োজন। মূল নথিপত্র ট্যাবে আরো নথি যুক্ত করুন।',
    comparison_matrix_label: 'তুলনা মেট্রিক্স:',
    comparison_matrix_desc: 'সকল সক্রিয় নথির মূল তথ্যক্ষেত্র পাশাপাশি তুলনা করে। অমিল দাগ ও পরিমাণ সরাসরি চিহ্নিত করা হয়।',
    documents_compared: 'টি নথি তুলনা করা হয়েছে',
    compared_field: 'তুলনাকৃত ক্ষেত্র',
    plot_reference_field: 'দাগের উল্লেখ',
    owner_seller_field: 'মালিক / বিক্রেতার উল্লেখ',
    purchaser_beneficiary_field: 'ক্রেতা / সুবিধাভোগীর উল্লেখ',
    execution_registration_field: 'নিবন্ধনের তারিখ',

    // Audit View
    audit_header_desc: 'SHA-256 সামঞ্জস্য যাচাই এবং কেসের স্থানীয় কার্যক্রমের ইতিহাস',
    audit_identity_notice: 'কার্যক্রমের ইতিহাস স্থানীয়ভাবে সংরক্ষিত; ব্যবহারকারীর পরিচয় যাচাইকৃত নয়',
    verifying_seal: 'যাচাই হচ্ছে...',
    crypto_seal_title: 'ইনপুট ফিঙ্গারপ্রিন্ট (SHA-256)',
    timezone_dhaka: 'ঢাকা সময় (UTC+০৬:০০)',
    run_id_label: 'রান আইডি',
    result: 'ফলাফল',
    audit_ledger_title: 'কার্যক্রম ও অডিট লেজার',
    loading_audit: 'অডিট ইভেন্ট লোড হচ্ছে...',
    no_audit_events: 'নির্বাচিত ফিল্টারে কোনো অডিট ইভেন্ট নেই।',
    sha256_digest_label: 'নির্ধারণবাদী SHA-256 ক্যানোনিকাল ডাইজেস্ট',
    error_label: 'ত্রুটি',
    awaiting_integrity: 'ইন্টিগ্রিটি মূল্যায়নের অপেক্ষায়।',
    no_seal_yet: 'এই কেসে এখনো কোনো বিশ্লেষণ চালানো হয়নি',
    calculating_hash: 'বর্তমান হ্যাশ গণনা হচ্ছে...',
    total_events: 'টি মোট ঘটনা',

    // Report View
    loading_report: 'যাচাই প্রতিবেদন প্রস্তুত হচ্ছে...',
    stale_run_warning: 'পুরনো বিশ্লেষণ — পুনরায় যাচাই প্রয়োজন',
    stale_run_desc: 'সর্বশেষ নিয়ম-পরীক্ষার পর রেকর্ড পরিবর্তন হয়েছে। অডিট অখণ্ডতা বজায় রাখতে যাচাই পুনরায় চালান।',
    export_stale_anyway: 'পুরনো প্রতিবেদন তবুও রপ্তানি করুন',
    report_error_title: 'প্রতিবেদন তৈরি করা সম্ভব হয়নি',
    report_error_desc: 'প্রতিবেদন প্রস্তুতিতে একটি ত্রুটি ঘটেছে।',
    stale_snapshot: 'পুরনো স্ন্যাপশট',
    sealed_snapshot: 'বিশ্লেষণের স্ন্যাপশট হালনাগাদ',
    report_dossier_label: 'স্ক্রিনিং প্রতিবেদন',
    screening_summary: 'পরীক্ষার সারসংক্ষেপ',
    short_report_notice: 'এই প্রতিবেদন শুধু দেওয়া তথ্য স্ক্রিনিং করে। কোনো সরকারি ব্যবস্থায় অনুসন্ধান করা হয়নি; এটি মালিকানা বা নথির সত্যতা নিশ্চিত করে না।',
    full_limitations: 'যাচাইয়ের সীমাবদ্ধতা ও সতর্কতা',
    as_of_date: 'যে তারিখ পর্যন্ত',
    reviewer: 'পর্যালোচক',
    timezone_label: 'সময় অঞ্চল',
    configuration_label: 'কনফিগারেশন (পরিমাণের সহনসীমা · দ্রুত হস্তান্তর · নামজারি রেফারেন্স)',
    parties_crosswalk_report: 'পক্ষ পরিচয় ও দাগ সংযোগের অবস্থা',
    parties: 'পক্ষসমূহ',
    aliases: 'বিকল্প নাম',
    confirmed: 'নিশ্চিত',
    unconfirmed: 'অনিশ্চিত',
    no_parties: 'কোনো পক্ষ যুক্ত করা হয়নি।',
    crosswalk_status: 'দাগ সংযোগ',
    no_crosswalks: 'কোনো দাগ সংযোগ যুক্ত করা হয়নি।',
    mismatch: 'অমিল',
    findings: 'টি ফলাফল',
    fictional_scenario: 'কাল্পনিক সিনারিও',
    report_h1: 'জমিট্রেস তদন্ত প্রতিবেদন',
    sample_data_label: 'নমুনা তথ্য',
    input_hash_label: 'ইনপুট স্টেট হ্যাশ',
    intact_matched: 'বিশ্লেষণের স্ন্যাপশটের সঙ্গে মিলে',
    mismatch_altered: 'বিশ্লেষণের স্ন্যাপশট থেকে আলাদা',
    unsealed_label: 'সিলবিহীন',
    landtech_eval_label: 'ল্যান্ডটেক ২০২৬ মূল্যায়ন',
    report_section1: 'পর্যালোচিত মূল নথিপত্র',
    report_section2: 'পাশাপাশি রেকর্ড তুলনা গ্রিড',
    evaluated_attr: 'মূল্যায়িত বৈশিষ্ট্য',
    consistency: 'সংগতি',
    report_section3: 'অসঙ্গতির বিস্তারিত ফলাফল',
    no_findings_report: 'কোনো ফলাফল তৈরি হয়নি।',
    cited_evidence: 'উদ্ধৃত প্রমাণ',
    followup_label: 'পরবর্তী পদক্ষেপ',
    report_section4: 'মালিকানা হস্তান্তরের সময়রেখা',
    date_col: 'তারিখ',
    transfer_col: 'হস্তান্তর',
    from_party_col: 'বিক্রেতা পক্ষ',
    to_party_col: 'ক্রেতা পক্ষ',
    plot_area_col: 'দাগ ও পরিমাণ',
    document_col: 'নথি',
    report_section5: 'বাহ্যিক যাচাই চেকলিস্ট',
    note_label: 'মন্তব্য',
    report_section6: 'অডিট ট্রেইল সারসংক্ষেপ',
    activity_context: 'কার্যক্রমের প্রেক্ষাপট',
    report_section7: 'যাচাই নিয়মাবলী চালু হয়েছে',
    dossier_ref: 'রান আইডি',

    // Parties & Crosswalk View
    parties_tab_title: 'নিশ্চিত পক্ষ পরিচয় ও দাগ ক্রশওয়াক',
    parties_tab_desc: 'বিভিন্ন নথিতে পক্ষের পরিচয় একীভূত করুন এবং জরিপ শ্রেণির দাগ-সংযোগ যাচাই করুন।',
    create_party_btn: '+ পক্ষ পরিচয় তৈরি করুন',
    loading_parties: 'পক্ষ পরিচয় ও দাগ-সংযোগ লোড হচ্ছে...',
    no_parties_msg: 'এখনো কোনো পক্ষ পরিচয় নিশ্চিত করা হয়নি। দলিল ও খতিয়ানের পক্ষ মেলাতে Party P1-এর মতো ট্যাগ তৈরি করুন।',
    col_canonical_label: 'একীভূত পরিচয়',
    col_linked_aliases: 'নথিতে থাকা নামের ভিন্ন রূপ',
    no_aliases_msg: 'কোনো বিকল্প নাম যুক্ত নেই',
    add_alias_btn: '+ বিকল্প নাম যুক্ত করুন',
    crosswalk_section_title: 'নিশ্চিত দাগ ক্রশওয়াক (CS / SA / RS / BS)',
    crosswalk_section_desc: 'ভিন্ন জরিপ শ্রেণির দাগ তুলনার জন্য স্পষ্ট সংযোগ দিন; এতে অনুমানভিত্তিক মিল এড়ানো যায়।',
    add_crosswalk_btn: '+ দাগ সংযোগ যুক্ত করুন',
    loading_crosswalk: 'দাগ সংযোগ লোড হচ্ছে...',
    no_crosswalk_msg: 'কোনো দাগ সংযোগ নেই। দলিলে ভিন্ন জরিপ শ্রেণি থাকলে সংযোগ যুক্ত করুন।',
    col_survey_a: 'উৎস জরিপ ও দাগ',
    col_survey_b: 'সংশ্লিষ্ট জরিপ ও দাগ',
    col_basis_note: 'যাচাইয়ের ভিত্তি',
    col_review_status: 'পর্যালোচনার অবস্থা',
    status_confirmed: 'নিশ্চিত',
    status_unconfirmed: 'নিশ্চিত নয়',
    no_note_recorded: 'কোনো নোট নেই',
  },
};

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function formatDigits(val: string | number, lang: Language): string {
  if (lang !== 'bn') return String(val);
  return String(val).replace(/\d/g, (d) => BANGLA_DIGITS[parseInt(d, 10)]);
}

/** Format API timestamps as UTC instants displayed in Bangladesh time. */
export function formatDhakaDateTime(
  value: string | Date,
  lang: Language,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const raw = value instanceof Date ? value.toISOString() : value;
  const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const instant = new Date(hasExplicitZone || !raw.includes('T') ? raw : `${raw}Z`);
  return instant.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-BD', {
    ...options,
    timeZone: 'Asia/Dhaka',
  });
}

export function t(key: string, lang: Language): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}

/** Localizes known comparison row labels while preserving unknown backend text. */
export function localizeComparisonField(label: string, lang: Language): string {
  if (lang !== 'bn') return label;
  const keys: Record<string, string> = {
    'Survey series': 'survey_series',
    'Plot reference (dag)': 'plot_reference_field',
    'Recorded area': 'area',
    'Owner / Seller reference': 'owner_seller_field',
    'Purchaser / Beneficiary reference': 'purchaser_beneficiary_field',
    'Registration date': 'execution_registration_field',
  };
  return keys[label] ? t(keys[label], lang) : label;
}

/** Localizes only the application's known record types; unknown values stay intact. */
export function localizeRecordType(value: string, lang: Language): string {
  if (lang !== 'bn') return value;
  const keys: Record<string, string> = {
    deed: 'deed',
    khatian: 'khatian',
    mutation: 'mutation',
    dcr: 'dcr',
    survey_reference: 'survey_reference',
    other: 'other',
  };
  return keys[value] ? t(keys[value], lang) : value;
}

export function localizeAreaUnit(value: string | null | undefined, lang: Language): string {
  if (!value || lang !== 'bn') return value || '';
  const units: Record<string, string> = { decimal: 'শতাংশ', shotok: 'শতাংশ', acre: 'একর', sqft: 'বর্গফুট', 'sq ft': 'বর্গফুট' };
  return units[value.toLowerCase()] ?? value;
}

export function localizeAreaValue(value: string | null | undefined, lang: Language): string {
  if (!value || lang !== 'bn') return value || '';
  const match = value.match(/^(\s*[\d.,]+\s+)(decimal|shotok|acre|sq\.?\s*ft)\s*$/i);
  return match ? `${match[1]}${localizeAreaUnit(match[2], lang)}` : value;
}

export function localizeComparisonValue(value: string, lang: Language): string {
  if (lang !== 'bn') return value;
  const known: Record<string, string> = {
    'N/A (khatian)': 'প্রযোজ্য নয় (খতিয়ান)',
    'Not supplied': 'সরবরাহ করা হয়নি',
  };
  if (known[value]) return known[value];
  const date = value.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/);
  if (date) {
    const months: Record<string, string> = {
      Jan: 'জানুয়ারি', Feb: 'ফেব্রুয়ারি', Mar: 'মার্চ', Apr: 'এপ্রিল', May: 'মে', Jun: 'জুন',
      Jul: 'জুলাই', Aug: 'আগস্ট', Sep: 'সেপ্টেম্বর', Oct: 'অক্টোবর', Nov: 'নভেম্বর', Dec: 'ডিসেম্বর',
    };
    return `${formatDigits(date[1], lang)} ${months[date[2]] ?? date[2]} ${formatDigits(date[3], lang)}`;
  }
  return localizeAreaValue(value, lang);
}

export function localizeComparisonDetails(value: string | null | undefined, lang: Language): string {
  if (!value || lang !== 'bn') return value || '';
  if (value === 'Normalized comparison evaluated by JT-R02 and JT-R05') {
    return 'JT-R02 ও JT-R05 অনুযায়ী রূপান্তরিত জমির পরিমাণ তুলনা করা হয়েছে।';
  }
  return value;
}

/**
 * Localizes status strings for badges and filter controls.
 */
export function localizeStatus(status: string | undefined | null, lang: Language): string {
  if (!status) return '';
  const key = String(status).toLowerCase();
  if (lang === 'bn') {
    switch (key) {
      case 'conflict_detected':
        return 'অসঙ্গতি শনাক্ত হয়েছে';
      case 'review_required':
        return 'পর্যালোচনা প্রয়োজন';
      case 'insufficient_information':
        return 'অপর্যাপ্ত তথ্য';
      case 'no_inconsistency_found':
        return 'কোনো অসঙ্গতি পাওয়া যায়নি';
      case 'not_applicable':
        return 'পরীক্ষা করা যায়নি';
      case 'draft':
        return 'খসড়া রেকর্ড';
      case 'in_review':
        return 'পর্যালোচনাধীন';
      case 'report_ready':
        return 'প্রতিবেদন প্রস্তুত';
      case 'archived':
        return 'আর্কাইভকৃত';
      case 'all':
        return 'সকল';
      case 'conflict':
      case 'conflicts':
        return 'অসঙ্গতিসমূহ';
      case 'match':
        return 'মিল আছে';
      case 'mismatch':
        return 'অমিল';
      case 'incomplete':
        return 'অসম্পূর্ণ';
      case 'reviewer_completed':
        return 'যাচাই সম্পন্ন';
      default:
        return translations.bn[key] || status;
    }
  }
  // English format
  switch (key) {
    case 'conflict_detected':
      return 'Conflict detected';
    case 'review_required':
      return 'Review required';
    case 'insufficient_information':
      return 'Insufficient information';
    case 'no_inconsistency_found':
      return 'No inconsistency found';
    case 'not_applicable':
      return 'Not assessed';
    case 'draft':
      return 'Draft';
    case 'in_review':
      return 'In review';
    case 'report_ready':
      return 'Report ready';
    case 'archived':
      return 'Archived';
    default:
      return translations.en[key] || status;
  }
}

export function localizeProvenance(provenance: string | undefined | null, lang: Language): string {
  if (!provenance) return '';
  const keys: Record<string, string> = {
    synthetic: 'provenance_demo',
    user_entered: 'provenance_user_entered',
    organizer: 'provenance_organizer',
    public: 'provenance_public',
  };
  return keys[provenance] ? t(keys[provenance], lang) : provenance;
}

export function localizeRuleName(ruleCode: string | undefined | null, lang: Language): string {
  if (!ruleCode) return '';
  const names: Record<string, [string, string]> = {
    'JT-R01': ['Plot reference comparison', 'দাগ নম্বরের তুলনা'],
    'JT-R02': ['Recorded area comparison', 'রেকর্ডকৃত জমির পরিমাণের তুলনা'],
    'JT-R03': ['Ownership chain continuity', 'মালিকানা শৃঙ্খলের ধারাবাহিকতা'],
    'JT-R04': ['Competing transfers', 'প্রতিদ্বন্দ্বী হস্তান্তর'],
    'JT-R05': ['Aggregate conveyance check', 'মোট হস্তান্তরিত জমির যাচাই'],
    'JT-R06': ['Date sequence check', 'তারিখের ক্রম যাচাই'],
    'JT-R07': ['Registration and mutation link', 'নিবন্ধন ও নামজারির সংযোগ'],
    'JT-R08': ['Rapid re-transfer screening', 'দ্রুত পুনঃহস্তান্তর যাচাই'],
    'JT-R09': ['Required field completeness', 'আবশ্যকীয় তথ্যের পূর্ণতা'],
    'JT-R10': ['Document hash reuse', 'নথির হ্যাশ পুনর্ব্যবহার'],
  };
  const pair = names[ruleCode.toUpperCase()];
  return pair ? pair[lang === 'bn' ? 1 : 0] : ruleCode;
}

/**
 * Localizes case titles safely while preserving dynamic values.
 */
export function localizeCaseTitle(title: string | undefined | null, lang: Language): string {
  if (!title) return '';
  if (lang !== 'bn') return title;

  const titleLower = title.trim().toLowerCase();

  // Known cases and scenario title mappings
  if (titleLower === 'transfer chain review') {
    return 'মালিকানা হস্তান্তর ধারাবাহিকতা পর্যালোচনা';
  }
  if (titleLower.includes('same seller executes duplicate full-holding sales')) {
    return 'একই বিক্রেতার কাছ থেকে পূর্ণ জমির দ্বৈত হস্তান্তর';
  }
  if (titleLower.includes('clean 3-link continuous chain') || titleLower.includes('clean continuous ownership chain')) {
    return 'দলিল, নামজারি ও ডিসিআর সহ ত্রুটিহীন ৩-স্তরের ধারাবাহিক শৃঙ্খল';
  }
  if (titleLower.includes('competing duplicate transfer') || titleLower.includes('competing transfer')) {
    return 'একই দাগে পরস্পরবিরোধী দ্বৈত হস্তান্তর';
  }
  if (titleLower.includes('over-conveyance & partial sale') || titleLower.includes('over-conveyance')) {
    return 'রেকর্ডের অতিরিক্ত হস্তান্তর ও আংশিক বিক্রয়';
  }
  if (titleLower.includes('unit conversion decimal vs sq ft') || titleLower.includes('unit conversion') || titleLower.includes('units conversion')) {
    return 'শতাংশ ও বর্গফুটের রূপান্তর: একটি সঠিক এবং একটি ১২% অসঙ্গতিপূর্ণ';
  }
  if (titleLower.includes('third transfer seller never appears') || titleLower.includes('chain gap')) {
    return 'তৃতীয় হস্তান্তরের বিক্রেতা পূর্বে ক্রেতা হিসেবে অনুপস্থিত (শৃঙ্খল বিচ্ছিন্নতা)';
  }
  if (titleLower.includes('mutation mismatch and rapid transfer') || titleLower.includes('rapid transfer')) {
    return 'নামজারি অসঙ্গতি এবং ১৪ দিনের মধ্যে দ্রুত হস্তান্তর';
  }
  if (titleLower.includes('registration-mutation mismatch and rapid re-transfer')) {
    return 'নিবন্ধন ও নামজারির অমিল এবং দ্রুত পুনঃহস্তান্তর';
  }
  if (titleLower.includes('records with blank and incomplete') || titleLower.includes('blank fields') || titleLower.includes('incomplete records')) {
    return 'অসম্পূর্ণ ও ফাঁকা তথ্যযুক্ত রেকর্ডসমূহ';
  }
  if (titleLower.includes('cross-series rs khatian vs bs deed') || titleLower.includes('cross-series') || titleLower.includes('cross-survey')) {
    return 'ক্রসওয়াক ম্যাপিং ছাড়া আরএস খতিয়ান বনাম বিএস দলিলের অমিল';
  }

  return title;
}

/** Explicit translations for the application's known synthetic scenario copy. */
export function localizeScenarioText(
  id: string,
  field: 'description' | 'expected_outcome',
  text: string,
  lang: Language,
): string {
  if (lang !== 'bn') return text;
  const messages: Record<string, Record<typeof field, string>> = {
    S1: {
      description: 'দলিল, নামজারি ও ডিসিআর নথিতে সামঞ্জস্যসহ তিন ধাপের ধারাবাহিক মালিকানা হস্তান্তর।',
      expected_outcome: 'সুনির্দিষ্ট যাচাইয়ে কোনো অসঙ্গতি পাওয়া যায়নি।',
    },
    S2: {
      description: 'একই বিক্রেতা একই জমির পূর্ণ অংশ দুটি পৃথক ক্রেতার কাছে কাছাকাছি সময়ে হস্তান্তর করেছেন।',
      expected_outcome: 'দ্বৈত হস্তান্তরে অসঙ্গতি (JT-R04) এবং মালিকানা-শৃঙ্খলে ঘাটতি (JT-R03) শনাক্ত হবে।',
    },
    S3: {
      description: 'বিক্রেতার ৫০ শতাংশ জমি রয়েছে; ধারাবাহিক দলিলে ৩০ ও ৩২ শতাংশ হস্তান্তরের তথ্য দেওয়া হয়েছে।',
      expected_outcome: 'মোট জমির অতিরিক্ত হস্তান্তরে অসঙ্গতি (JT-R05); আংশিক হস্তান্তরে পর্যালোচনা প্রয়োজন (JT-R04)।',
    },
    S4: {
      description: 'প্রথম দলিলে শতাংশ ও বর্গফুটের রূপান্তর মিলে যায়; দ্বিতীয় দলিলে পরিমাণের অমিল ১২%।',
      expected_outcome: 'রূপান্তরিত প্রথম জোড়ায় অসঙ্গতি নেই; ১২% অমিলে অসঙ্গতি (JT-R02) শনাক্ত হবে।',
    },
    S5: {
      description: 'তৃতীয় হস্তান্তরের বিক্রেতাকে আগের কোনো দলিল বা নথিতে ক্রেতা হিসেবে পাওয়া যায়নি।',
      expected_outcome: 'মালিকানা-শৃঙ্খলের ধারাবাহিকতায় পর্যালোচনা প্রয়োজন (JT-R03); সময়রেখায় বিচ্ছিন্নতা দেখা যাবে।',
    },
    S6: {
      description: 'নামজারি নথিতে নিবন্ধিত দলিলের চেয়ে ভিন্ন ক্রেতার নাম রয়েছে; ২০ দিনের মধ্যে পুনরায় হস্তান্তর হয়েছে।',
      expected_outcome: 'নামজারির সুবিধাভোগীতে অসঙ্গতি (JT-R07); দ্রুত পুনঃহস্তান্তরে পর্যালোচনা প্রয়োজন (JT-R08)।',
    },
    S7: {
      description: 'গুরুত্বপূর্ণ তথ্য ফাঁকা; যাচাই ব্যবস্থা ফাঁকা তথ্যকে মিল হিসেবে না ধরে সংশ্লিষ্ট নিয়মগুলোকে আটকে রাখে।',
      expected_outcome: 'তথ্যের ঘাটতিতে অপর্যাপ্ত তথ্য (JT-R09); আটকে থাকা নিয়মগুলো আলাদাভাবে দেখানো হবে।',
    },
    S8: {
      description: 'পর্যালোচকের দাগ-সংযোগ মানচিত্র ছাড়া আরএস খতিয়ানের সঙ্গে বিএস দলিল তুলনা করা হয়েছে।',
      expected_outcome: 'ভিন্ন জরিপের দাগের সমতা অপর্যাপ্ত তথ্য হিসেবে দেখানো হবে (JT-R01)।',
    },
  };
  const key = id.toUpperCase();
  return messages[key]?.[field] ?? text;
}

/**
 * Localizes rule categories into natural terminology.
 */
export function localizeCategory(category: string | undefined | null, lang: Language): string {
  if (!category) return '';
  if (lang !== 'bn') return category.replace(/_/g, ' ');

  const cat = category.toLowerCase().replace(/_/g, ' ');
  switch (cat) {
    case 'plot mismatch':
      return 'দাগ নম্বরের অমিল';
    case 'area discrepancy':
    case 'area mismatch':
      return 'জমির পরিমাণের অসঙ্গতি';
    case 'chain gap':
      return 'মালিকানা শৃঙ্খল বিচ্ছিন্নতা';
    case 'duplicate sale':
      return 'দ্বৈত হস্তান্তর / বিক্রয়';
    case 'over conveyance':
      return 'অতিরিক্ত হস্তান্তর';
    case 'date sequence anomaly':
      return 'তারিখের অসামঞ্জস্য';
    case 'mutation deed mismatch':
    case 'reg mutation mismatch':
      return 'নামজারি ও দলিলের অসঙ্গতি';
    case 'rapid transfer':
      return 'দ্রুত হস্তান্তর';
    case 'missing mandatory field':
    case 'missing data':
      return 'আবশ্যকীয় তথ্যের অনুপস্থিতি';
    case 'document hash reuse':
      return 'নথির হ্যাশ পুনব্যবহার';
    default:
      return category.replace(/_/g, ' ');
  }
}

/**
 * Localizes finding summaries and explanations into natural Bangla while preserving identifiers.
 */
export function localizeFindingSummary(summary: string | undefined | null, lang: Language): string {
  if (!summary) return '';
  if (lang !== 'bn') return summary;

  const knownSummaries: Array<[string, string]> = [
    ['Plot references agree within same survey series', 'একই জরিপ শ্রেণিতে দাগের উল্লেখে মিল রয়েছে'],
    ['Recorded areas agree within tolerance', 'রেকর্ডকৃত জমির পরিমাণ নির্ধারিত সহনসীমার মধ্যে মিলেছে'],
    ['Date sequence and registration intervals valid', 'তারিখের ধারা ও নিবন্ধনের ব্যবধান সঠিক রয়েছে'],
    ['Required fields complete across all entered records', 'প্রদত্ত সব নথিতে আবশ্যকীয় তথ্য পূরণ করা হয়েছে'],
    ['Conflicting plot numbers in same survey series', 'একই জরিপ শ্রেণিতে দাগ নম্বরে অমিল রয়েছে'],
    ['Cross-series plot comparison unassessable without crosswalk', 'দাগ-সংযোগ মানচিত্র ছাড়া ভিন্ন জরিপ শ্রেণির দাগ তুলনা করা যাচ্ছে না'],
  ];
  const known = knownSummaries.find(([english]) => summary.toLowerCase().startsWith(english.toLowerCase()));
  if (known) return known[1];

  const areaDifference = summary.match(/^Area difference \((\d+(?:\.\d+)?)%\) exceeds (\d+(?:\.\d+)?)% tolerance$/i);
  if (areaDifference) return `জমির পরিমাণের পার্থক্য ${formatDigits(areaDifference[1], 'bn')}%, যা ${formatDigits(areaDifference[2], 'bn')}% সহনসীমার বেশি`;
  const rapidInterval = summary.match(/^Transfer interval \((\d+) days\) exceeds rapid re-transfer window \((\d+) days\)$/i);
  if (rapidInterval) return `হস্তান্তরের ব্যবধান ${formatDigits(rapidInterval[1], 'bn')} দিন, যা দ্রুত পুনঃহস্তান্তরের ${formatDigits(rapidInterval[2], 'bn')} দিনের সীমা অতিক্রম করেছে`;
  const rapidOutside = summary.match(/^Transfer interval \((\d+) days\) is outside the (\d+)-day rapid re-transfer window$/i);
  if (rapidOutside) return `হস্তান্তরের ব্যবধান ${formatDigits(rapidOutside[1], 'bn')} দিন; এটি ${formatDigits(rapidOutside[2], 'bn')} দিনের পুনঃহস্তান্তর পর্যবেক্ষণসীমার বাইরে`;
  const continuousChain = summary.match(/^Chain continuous from (.*?) to (.*?)$/i);
  if (continuousChain) return `${continuousChain[1]} থেকে ${continuousChain[2]} পর্যন্ত মালিকানা-শৃঙ্খল অবিচ্ছিন্ন`;
  const aggregateClean = summary.match(/^(.*?) conveyed ([\d.]+) of ([\d.]+) decimal \((\d+) (transfer|transfers)\)$/i);
  if (aggregateClean) return `${aggregateClean[1]} ${aggregateClean[5] === 'transfer' ? 'একটি হস্তান্তরে' : `${formatDigits(aggregateClean[4], 'bn')}টি হস্তান্তরে`} ${formatDigits(aggregateClean[2], 'bn')} শতাংশ জমি ${formatDigits(aggregateClean[3], 'bn')} শতাংশ ধারণক্ষমতার মধ্যে হস্তান্তর করেছেন`;
  const initialSeller = summary.match(/^Seller of (.*?) matches owner named in the khatian$/i);
  if (initialSeller) return `${initialSeller[1]}-এর বিক্রেতার নাম খতিয়ানে উল্লিখিত মালিকের সঙ্গে মিলে`;
  if (summary === 'No mutation record supplied') return 'কোনো নামজারি নথি দেওয়া হয়নি';

  const chainBroken = summary.match(/Chain broken: seller in (.*?) differs from predecessor owner/i);
  if (chainBroken) return `${chainBroken[1]}-এর বিক্রেতার সঙ্গে পূর্ববর্তী নথির মালিকের মিল নেই`;
  const duplicate = summary.match(/Potential duplicate conveyance: multiple full-holding transfers by (.*)/i);
  if (duplicate) return `${duplicate[1]} একাধিক ক্রেতার কাছে একই পূর্ণ জমি হস্তান্তর করেছেন`;
  const aggregate = summary.match(/Aggregate conveyed area exceeds recorded holding \((.*?)\)/i);
  if (aggregate) return `মোট হস্তান্তরিত জমির পরিমাণ রেকর্ডকৃত ধারণক্ষমতা অতিক্রম করেছে (${aggregate[1]})`;
  const mutationGap = summary.match(/No mutation record linked after reference interval \((.*?)\)/i);
  if (mutationGap) return `${mutationGap[1]}-এর জন্য নির্ধারিত সময়সীমার পরও নামজারি নথি যুক্ত নেই`;

  // Pattern: "Initial transfer {ref} has no documented predecessor title"
  const predecessorMatch = summary.match(/Initial transfer (.*?) has no documented predecessor title/i);
  if (predecessorMatch) {
    return `প্রাথমিক হস্তান্তর ${predecessorMatch[1]} এর কোনো পূর্ববর্তী মূল মালিকানা স্বত্ব নথিবদ্ধ নেই`;
  }


  // Pattern: "Party alias for {name} unconfirmed"
  const aliasMatch = summary.match(/Party alias for (.*?) unconfirmed/i);
  if (aliasMatch) {
    return `${aliasMatch[1]} এর নামের বিকল্প রূপ/উপনাম এখনও নিশ্চিত করা হয়নি`;
  }

  // Pattern: "Parties not entered on {ref}"
  const partiesMatch = summary.match(/Parties not entered on (.*)/i);
  if (partiesMatch) {
    return `${partiesMatch[1]} এর ক্ষেত্রে পক্ষগণের তথ্য প্রদান করা হয়নি`;
  }

  // Pattern: "Competing conveyances on holding {ref}"
  const competingMatch = summary.match(/Competing conveyances on holding (.*)/i);
  if (competingMatch) {
    return `${competingMatch[1]} এর একই জমিতে পরস্পরবিরোধী একাধিক বিক্রয় হস্তান্তর শনাক্ত হয়েছে`;
  }

  // Pattern: "Total conveyed area ({A}) exceeds recorded source area ({B})"
  const overConvMatch = summary.match(/Total conveyed area (.*?) exceeds recorded source area (.*)/i);
  if (overConvMatch) {
    return `মোট হস্তান্তরিত জমির পরিমাণ মূল রেকর্ডের পরিমাণের চেয়ে বেশি`;
  }

  // Pattern: a linked mutation registration precedes deed registration
  if (summary.toLowerCase().includes('mutation registration precedes cited deed registration')) {
    return 'উদ্ধৃত দলিলের নিবন্ধনের আগেই নামজারির নিবন্ধন হয়েছে';
  }

  // Pattern: "Rapid transfer within"
  const rapidMatch = summary.match(/Rapid transfer within (.*?) days/i);
  if (rapidMatch) {
    return `${formatDigits(rapidMatch[1], 'bn')} দিনের মধ্যে অস্বাভাবিক দ্রুত হস্তান্তর শনাক্ত হয়েছে`;
  }
  const rapidResale = summary.match(/Rapid re-transfer within (\d+) days \(threshold: (\d+) days\)/i);
  if (rapidResale) return `${formatDigits(rapidResale[1], 'bn')} দিনের মধ্যে দ্রুত পুনঃহস্তান্তর (নির্ধারিত সীমা ${formatDigits(rapidResale[2], 'bn')} দিন)`;

  // Pattern: "Cross-series survey mismatch"
  if (summary.toLowerCase().includes('cross-series survey mismatch')) {
    return 'অনুমোদিত দাগ ক্রশওয়াক ছাড়া ভিন্ন জরিপ শ্রেণির দাগের অমিল';
  }

  // Pattern: "Missing mandatory fields"
  if (summary.toLowerCase().includes('missing mandatory fields') || summary.toLowerCase().includes('mandatory field missing')) {
    return 'রেকর্ডে আবশ্যকীয় তথ্যের অনুপস্থিতি রয়েছে';
  }

  // Pattern: "Identical document hash registered"
  if (summary.toLowerCase().includes('identical document hash')) {
    return 'একই দলিলের ডিজিটাল হ্যাশ ভিন্ন পক্ষগণের নামে ব্যবহৃত হয়েছে';
  }

  return summary;
}

/** Translate known rule-engine notes and preserve unknown dynamic text verbatim. */
export function localizeFindingNote(value: string | undefined | null, lang: Language): string {
  if (!value || lang !== 'bn') return value || '';
  const messages: Record<string, string> = {
    'Checks are as entered; ground boundaries, map sheet distortions, and physical plot coordinates are not assessed.': 'প্রদত্ত তথ্যের ভিত্তিতে যাচাই করা হয়েছে; মাঠের সীমানা, নকশার বিকৃতি বা ভৌত স্থানাঙ্ক যাচাই করা হয়নি।',
    'Verify plot numbers on certified mouza map sheets and khatians through the Upazila Land Office (AC Land).': 'উপজেলা ভূমি অফিসে (এসি ল্যান্ড) মৌজা নকশা ও খতিয়ানের সত্যায়িত কপিতে দাগ নম্বর যাচাই করুন।',
    'Areas are as entered; ground physical possession and boundary shapefiles are not assessed.': 'প্রদত্ত জমির পরিমাণ ব্যবহার করা হয়েছে; বাস্তব দখল বা সীমানার ডিজিটাল নকশা যাচাই করা হয়নি।',
    'Inspect certified copies of deeds and khatians to confirm recorded area.': 'রেকর্ডকৃত জমির পরিমাণ নিশ্চিত করতে দলিল ও খতিয়ানের সত্যায়িত কপি দেখুন।',
    'Areas are as entered; boundaries and partial-plot descriptions are not assessed.': 'প্রদত্ত জমির পরিমাণ ব্যবহার করা হয়েছে; সীমানা ও আংশিক দাগের বিবরণ যাচাই করা হয়নি।',
    'Evaluates only supplied documents within this case; inheritance, unrecorded oral partitions, and external title deeds are not in scope.': 'এই কেসে সরবরাহ করা নথিই শুধু মূল্যায়ন করে; উত্তরাধিকার, অনথিভুক্ত মৌখিক বণ্টন ও বাইরের বায়া দলিল এর আওতায় নেই।',
    'Verify chain of title (baya deeds / পিট দলিল) backwards to the relevant survey khatian at the Sub-Registry office.': 'সাব-রেজিস্ট্রি অফিসে সংশ্লিষ্ট জরিপের খতিয়ান পর্যন্ত আগের বায়া দলিল ধরে মালিকানা-শৃঙ্খল যাচাই করুন।',
    'Confirm areas on the original deeds through an authorized source.': 'অনুমোদিত উৎসের মাধ্যমে মূল দলিলে জমির পরিমাণ নিশ্চিত করুন।',
    'AC Land e-mutation records and Sub-Registry e-registration records are maintained in separate administrative systems; automated synchronization is not assumed.': 'এসি ল্যান্ডের ই-নামজারি ও সাব-রেজিস্ট্রির ই-নিবন্ধন আলাদা প্রশাসনিক ব্যবস্থায় রাখা হয়; এগুলোর স্বয়ংক্রিয় সমন্বয় ধরে নেওয়া হয় না।',
    'Check e-mutation portal (mutation.land.gov.bd) for pending mutation case.': 'নামজারি কেস বিচারাধীন কি না তা ই-নামজারি পোর্টালে (mutation.land.gov.bd) যাচাই করুন।',
    'Verify registration date and volume index stamp at the Sub-Registry office.': 'সাব-রেজিস্ট্রি অফিসে নিবন্ধনের তারিখ ও ভলিউম সূচির ছাপ যাচাই করুন।',
    'Rapid re-transfer is not unlawful per se; emergency liquidations, familial reorganizations, and commercial resales may occur legitimately.': 'দ্রুত পুনঃহস্তান্তর নিজে থেকেই বেআইনি নয়; জরুরি বিক্রি, পারিবারিক পুনর্বণ্টন বা ব্যবসায়িক পুনর্বিক্রয় বৈধ হতে পারে।',
    'Does not determine legal priority; court decrees, pending civil suits, and unregistered agreements are not tracked.': 'আইনি অগ্রাধিকার নির্ধারণ করে না; আদালতের আদেশ, চলমান দেওয়ানি মামলা ও অনিবন্ধিত চুক্তি এখানে অনুসরণ করা হয় না।',
    'Examine Sub-Registry Volume Books (বালাম বহি) for prior registered conveyances.': 'আগের নিবন্ধিত হস্তান্তর যাচাই করতে সাব-রেজিস্ট্রি অফিসের ভলিউম বই (বালাম বহি) দেখুন।',
    'Reflects only completeness of metadata entered into the case; does not verify whether entered values are authentic.': 'কেসে দেওয়া তথ্য কতটা পূর্ণ তা দেখায়; তথ্যের সত্যতা যাচাই করে না।',
    'Maintain complete records for investigation ledger.': 'তদন্ত লেজারের জন্য সব প্রয়োজনীয় নথি সংরক্ষণ করুন।',
    'Obtain complete certified copies of missing records to fill required fields.': 'আবশ্যকীয় তথ্য পূরণে অনুপস্থিত নথির সম্পূর্ণ সত্যায়িত কপি সংগ্রহ করুন।',
  };
  return messages[value] ?? value;
}

/** Localize known record-field identifiers while keeping IDs and values unchanged. */
export function localizeRecordField(field: string, lang: Language): string {
  const fields: Record<string, Record<Language, string>> = {
    dag_no: { en: 'Plot number', bn: 'দাগ নম্বর' },
    area_value: { en: 'Recorded area', bn: 'জমির পরিমাণ' },
    event_date: { en: 'Transfer event date', bn: 'হস্তান্তরের তারিখ' },
    'record_date/registration_date': { en: 'Record or registration date', bn: 'নথি বা নিবন্ধনের তারিখ' },
    area_unit: { en: 'Area unit', bn: 'পরিমাপের একক' },
    seller_party_id: { en: 'Seller', bn: 'বিক্রেতা পক্ষ' },
    buyer_party_id: { en: 'Buyer', bn: 'ক্রেতা পক্ষ' },
    owner_party_id: { en: 'Owner', bn: 'মালিক পক্ষ' },
    registration_date: { en: 'Registration date', bn: 'নিবন্ধনের তারিখ' },
    record_date: { en: 'Record date', bn: 'নথির তারিখ' },
    survey_series: { en: 'Survey series', bn: 'জরিপ শ্রেণি' },
    deed_no: { en: 'Deed number', bn: 'দলিল নম্বর' },
    khatian_no: { en: 'Khatian number', bn: 'খতিয়ান নম্বর' },
    mutation_case_no: { en: 'Mutation case number', bn: 'নামজারি কেস নম্বর' },
  };
  return fields[field]?.[lang] ?? field;
}

export function localizeObservedKey(key: string, lang: Language): string {
  const known: Record<string, Record<Language, string>> = {
    seller: { en: 'Seller', bn: 'বিক্রেতা' }, buyer: { en: 'Buyer', bn: 'ক্রেতা' },
    owner: { en: 'Owner', bn: 'মালিক' }, deeds: { en: 'Deeds', bn: 'দলিলসমূহ' },
    buyers: { en: 'Buyers', bn: 'ক্রেতাগণ' }, deed_no: { en: 'Deed number', bn: 'দলিল নম্বর' },
    cited_deed_no: { en: 'Cited deed number', bn: 'উদ্ধৃত দলিল নম্বর' },
    available_deeds: { en: 'Deed numbers in case', bn: 'কেসে থাকা দলিল নম্বর' },
    missing_fields: { en: 'Missing fields', bn: 'অনুপস্থিত তথ্য' },
    event_date: { en: 'Transfer event date', bn: 'হস্তান্তরের তারিখ' },
    'record_date/registration_date': { en: 'Record or registration date', bn: 'নথি বা নিবন্ধনের তারিখ' },
    holding_area_decimal: { en: 'Recorded holding (decimal)', bn: 'রেকর্ডকৃত জমি (শতাংশ)' },
    conveyed_total_decimal: { en: 'Total conveyed (decimal)', bn: 'মোট হস্তান্তরিত (শতাংশ)' },
  };
  if (known[key]) return known[key][lang];
  if (lang !== 'bn') return key;
  const suffixes: Record<string, string> = {
    '_dag': 'দাগ নম্বর', '_original': 'মূল জমির পরিমাণ', '_seller': 'বিক্রেতা',
    '_buyer': 'ক্রেতা', '_seller_party_id': 'বিক্রেতা পক্ষ', '_buyer_party_id': 'ক্রেতা পক্ষ',
    '_owner_party_id': 'মালিক পক্ষ', '_registration_date': 'নিবন্ধনের তারিখ', '_record_date': 'নথির তারিখ',
  };
  const suffix = Object.keys(suffixes).find((candidate) => key.endsWith(candidate));
  if (!suffix) {
    const fields: Record<string, string> = {
      diff_pct: 'পরিমাণের অমিল (%)', holding_area_decimal: 'রেকর্ডকৃত ধারণক্ষমতা (শতাংশ)',
      conveyed_total_decimal: 'মোট হস্তান্তরিত জমি (শতাংশ)', tolerance_pct: 'সহনসীমা (%)',
      verified_dated_records: 'তারিখযুক্ত নথি', record_count: 'নথির সংখ্যা',
      preceding_buyer: 'পূর্ববর্তী ক্রেতা', current_seller: 'বর্তমান বিক্রেতা',
      khatian_owner: 'খতিয়ানভুক্ত মালিক', seller: 'বিক্রেতা', buyer: 'ক্রেতা',
      days_elapsed: 'অতিক্রান্ত দিন', threshold_days: 'নির্ধারিত সময়সীমা (দিন)',
      reference_interval_days: 'রেফারেন্স ব্যবধান (দিন)', prior_event: 'পূর্ববর্তী হস্তান্তর',
      current_event: 'বর্তমান হস্তান্তর',
    };
    return fields[key] ?? localizeRecordField(key, lang);
  }
  return `${key.slice(0, -suffix.length)} · ${suffixes[suffix]}`;
}

/**
 * Localizes finding explanations into natural Bangla while preserving context.
 */
export function localizeFindingExplanation(explanation: string | undefined | null, lang: Language): string {
  if (!explanation) return '';
  if (lang !== 'bn') return explanation;

  const plotMatch = explanation.match(/^(.*?) and (.*?) both cite plot (.*?) in survey series (.*?)\.$/i);
  if (plotMatch) return `${plotMatch[1]} ও ${plotMatch[2]} উভয় নথিতে ${plotMatch[4]} জরিপ শ্রেণির ${plotMatch[3]} দাগ উল্লেখ রয়েছে।`;
  const areaMatch = explanation.match(/^Normalized areas match within ([\d.]+)% tolerance: (.*?) vs (.*?)\.$/i);
  if (areaMatch) return `রূপান্তরিত জমির পরিমাণ ${areaMatch[1]}% সহনসীমার মধ্যে মিলেছে: ${areaMatch[2]} ও ${areaMatch[3]}।`;
  if (explanation.startsWith('Seller of ') && explanation.includes('does not match the confirmed purchaser')) {
    return 'বর্তমান দলিলের বিক্রেতা পূর্ববর্তী হস্তান্তরের নিশ্চিত ক্রেতার সঙ্গে মেলেনি। উল্লেখিত দলিল ও পক্ষের তথ্য নথির মূল কপিতে যাচাই করুন।';
  }
  if (explanation.startsWith('Seller Party ') && explanation.includes('executed multiple deeds')) {
    return 'একই বিক্রেতা পৃথক ক্রেতাদের কাছে একাধিক দলিলে পূর্ণ জমি হস্তান্তরের তথ্য দিয়েছেন। দলিলগুলো ও সংশ্লিষ্ট পক্ষের পরিচয় মূল নথি থেকে যাচাই করুন।';
  }
  if (explanation.startsWith('Deed ') && explanation.includes('exceeding the reference interval')) {
    return 'দলিল নিবন্ধনের পর নির্ধারিত সময়সীমার মধ্যে নামজারি নথি দেওয়া হয়নি। সংশ্লিষ্ট নামজারি আবেদন ও কেসের অবস্থা যাচাই করুন।';
  }
  if (explanation.startsWith('Holding transferred in ') && explanation.includes('within ')) {
    return 'পূর্ববর্তী হস্তান্তরের অল্প সময়ের মধ্যে জমিটি আবার হস্তান্তরের তথ্য রয়েছে। লেনদেন, দখল এবং সংশ্লিষ্ট দলিল যাচাই করুন।';
  }
  if (explanation.startsWith('All deed, khatian, and mutation records')) {
    return 'দেওয়া দলিল, খতিয়ান ও নামজারি নথিতে প্রয়োজনীয় দাগ, পক্ষ, তারিখ ও জমির পরিমাণের তথ্য রয়েছে।';
  }
  const overSale = explanation.match(/^(.*?) and (.*?) together convey ([\d.]+) decimal out of a recorded holding of ([\d.]+) decimal \(tolerance ([\d.]+)%\)\./i);
  if (overSale) return `${overSale[1]} ও ${overSale[2]} মিলিয়ে ${overSale[4]} শতাংশ রেকর্ডকৃত জমির বিপরীতে ${overSale[3]} শতাংশ হস্তান্তরের তথ্য রয়েছে (সহনসীমা ${overSale[5]}%)। মূল দলিলের পরিমাণ অনুমোদিত উৎস থেকে নিশ্চিত করুন।`;
  if (explanation.startsWith('Execution, registration, and transfer event dates follow chronological order')) {
    return 'সম্পাদন, নিবন্ধন ও হস্তান্তরের তারিখ কালানুক্রমিকভাবে সাজানো; তারিখের ক্রমে উল্টোতা নেই।';
  }

  if (explanation.includes('no prior root title record or khatian is supplied in the case')) {
    return 'নথিবদ্ধ প্রথম হস্তান্তরের জন্য কোনো পূর্ববর্তী মূল খতিয়ান বা বায়া দলিলের রেকর্ড এই কেসে সরবরাহ করা হয়নি।';
  }
  if (explanation.includes('matches the owner named in the supplied khatian record')) {
    return 'বিক্রেতার নাম সরবরাহ করা খতিয়ান নথিতে উল্লিখিত মালিকের সঙ্গে মিলে। এই মিল আইনি মালিকানা প্রতিষ্ঠা করে না।';
  }
  if (explanation.includes('awaiting reviewer confirmation')) {
    return 'বিক্রেতার নামের বানান বা ভিন্নতা পর্যালোচকের ম্যানুয়াল অনুমোদনের অপেক্ষায় রয়েছে।';
  }
  if (explanation.includes('are not entered on')) {
    return 'ক্রেতা বা বিক্রেতার তথ্য অনুপস্থিত থাকায় ধারাবাহিকতা সম্পূর্ণ যাচাই করা সম্ভব হয়নি।';
  }
  if (explanation.includes('exceeds the maximum permissible recorded holding area')) {
    return 'একই খতিয়ান বা জোতের অধীনে মোট হস্তান্তরিত জমির পরিমাণ অনুমোদিত মূল পরিমাণের সীমা অতিক্রম করেছে।';
  }
  if (explanation.includes('occurred within')) {
    return 'পূর্ববর্তী হস্তান্তরের অতি অল্প সময়ের মধ্যে পুনরায় জমিটি হস্তান্তর করা হয়েছে, যা অধিকতর সতর্ক অনুসন্ধানের নির্দেশ করে।';
  }

  return explanation;
}

/**
 * Localizes checklist items into natural Bangla.
 */
export function localizeChecklistLabel(label: string | undefined | null, lang: Language): string {
  if (!label) return '';
  if (lang !== 'bn') return label;

  const l = label.trim().toLowerCase();
  if (l.includes('confirm source documents')) {
    return 'সাব-রেজিস্ট্রি বা অনুমোদিত দপ্তরের মাধ্যমে মূল নথিপত্র যাচাই';
  }
  if (l.includes('verify plot continuity across survey series')) {
    return 'জরিপ শ্রেণিভেদে দাগের ধারাবাহিকতা নিশ্চিতকরণ (CS, SA, RS, BS)';
  }
  if (l.includes('confirm recorded area on original certified records')) {
    return 'মূল জাবেদা নকল থেকে জমির রেকর্ডকৃত পরিমাণ ও পরিমাপ একক যাচাই';
  }
  if (l.includes('review transfer sequence for missing links')) {
    return 'মালিকানা হস্তান্তরের ধারায় কোনো অনুপস্থিত যোগসূত্র বা বায়া দলিলের ঘাটতি আছে কিনা পরীক্ষা';
  }
  if (l.includes('check mutation entry and disposal status')) {
    return 'এসি ল্যান্ড অফিস বা ই-নামজারি পোর্টাল থেকে নামজারি কেস ও ডিসিআর এর অবস্থা যাচাই';
  }
  if (l.includes('review land development tax receipts')) {
    return 'হালনাগাদ ভূমি উন্নয়ন কর (দাখিলা) পরিশোধের রশিদ ও হোল্ডিং যাচাই';
  }
  if (l.includes('check khas, acquisition, and dispute status')) {
    return 'জমিটি খাস, অর্পিত, অধিগ্রহণকৃত বা বিচারাধীন মোকদ্দমায় স্থগিত কিনা তা যাচাই';
  }
  if (l.includes('seek qualified legal or demarcation survey review')) {
    return 'জটিল উত্তরাধিকার বা সীমানা বিরোধের ক্ষেত্রে অভিজ্ঞ আইনজীবী বা সার্ভেয়ারের পরামর্শ গ্রহণ';
  }

  return label;
}
