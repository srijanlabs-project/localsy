import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

function readFile(relPath) {
  const abs = path.join(projectRoot, relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing required file: ${relPath}`);
  }
  return fs.readFileSync(abs, 'utf8');
}

function mustContain(text, pattern, label, relPath) {
  if (!pattern.test(text)) {
    throw new Error(`Workflow smoke failed: ${label} not found in ${relPath}`);
  }
}

const serverText = readFile('server.js');
const appText = readFile('src/App.tsx');
const adminConsoleText = readFile('src/components/AdminConsole.tsx');

const serverRouteChecks = [
  [/app\.post\('\/api\/scalable-homepage-config\/templates'/, 'template create route'],
  [/app\.put\('\/api\/scalable-homepage-config\/templates\/:templateId'/, 'template update route'],
  [/app\.delete\('\/api\/scalable-homepage-config\/templates\/:templateId'/, 'template delete route'],
  [/app\.post\('\/api\/scalable-homepage-config\/templates\/:templateId\/sections'/, 'template section create route'],
  [/app\.put\('\/api\/scalable-homepage-config\/templates\/:templateId\/sections\/reorder'/, 'template section reorder route'],
  [/app\.put\('\/api\/scalable-homepage-config\/templates\/:templateId\/sections\/:sectionId'/, 'template section update route'],
  [/app\.post\('\/api\/scalable-homepage-config\/templates\/:templateId\/sections\/:sectionId\/duplicate'/, 'template section duplicate route'],
  [/app\.delete\('\/api\/scalable-homepage-config\/templates\/:templateId\/sections\/:sectionId'/, 'template section delete route'],
  [/app\.post\('\/api\/scalable-homepage-config\/templates\/:templateId\/sections\/sync-locality'/, 'template sync-locality route'],
  [/app\.post\('\/api\/scalable-homepage-config\/assignments'/, 'assignment create route'],
  [/app\.put\('\/api\/scalable-homepage-config\/assignments\/:assignmentId'/, 'assignment update route'],
  [/app\.delete\('\/api\/scalable-homepage-config\/assignments\/:assignmentId'/, 'assignment delete route'],
  [/app\.post\('\/api\/scalable-homepage-config\/campaigns'/, 'campaign create route'],
  [/app\.put\('\/api\/scalable-homepage-config\/campaigns\/:campaignId'/, 'campaign update route'],
  [/app\.delete\('\/api\/scalable-homepage-config\/campaigns\/:campaignId'/, 'campaign delete route'],
  [/app\.get\('\/api\/scalable-homepage-config\/snapshots'/, 'snapshot list route'],
  [/app\.delete\('\/api\/scalable-homepage-config\/snapshots\/:snapshotId'/, 'snapshot delete route'],
  [/app\.post\('\/api\/scalable-homepage-config\/sync-legacy-layouts'/, 'legacy layout sync route'],
  [/app\.post\('\/api\/scalable-homepage-config\/sync-legacy-campaigns'/, 'legacy campaign sync route'],
  [/app\.post\('\/api\/scalable-homepage-config\/reseed-legacy'/, 'legacy reseed route'],
  [/app\.post\('\/api\/resolved-homepage\/publish'/, 'resolved publish route'],
  [/app\.post\('\/api\/resolved-homepage\/snapshots\/delete'/, 'resolved snapshot delete route'],
];

for (const [pattern, label] of serverRouteChecks) {
  mustContain(serverText, pattern, label, 'server.js');
}

const appHandlerChecks = [
  [/const handleSaveScalableTemplate = async/, 'template save handler'],
  [/const handleDeleteScalableTemplate = async/, 'template delete handler'],
  [/const handleSaveScalableAssignment = async/, 'assignment save handler'],
  [/const handleDeleteScalableAssignment = async/, 'assignment delete handler'],
  [/const handleSaveScalableCampaign = async/, 'campaign save handler'],
  [/const handleDeleteScalableCampaign = async/, 'campaign delete handler'],
  [/const handleCreateScalableTemplateSection = async/, 'template section create handler'],
  [/const handleUpdateScalableTemplateSection = async/, 'template section update handler'],
  [/const handleReorderScalableTemplateSections = async/, 'template section reorder handler'],
  [/const handleDuplicateScalableTemplateSection = async/, 'template section duplicate handler'],
  [/const handleDeleteScalableTemplateSection = async/, 'template section delete handler'],
  [/const handleSyncScalableTemplateSectionsFromLocality = async/, 'template section locality sync handler'],
  [/const handleRefreshScalablePublishedSnapshots = async/, 'snapshot refresh handler'],
  [/const handleDeleteScalablePublishedSnapshot = async/, 'snapshot delete handler'],
  [/const handleReseedScalableHomepageConfig = async/, 'legacy reseed handler'],
  [/const handlePublishResolvedHomepages = async/, 'resolved publish handler'],
  [/const handleDeleteResolvedHomepageSnapshots = async/, 'resolved snapshot delete handler'],
  [/const handleSyncScalableLegacyLayouts = async/, 'legacy layout sync handler'],
  [/const handleSyncScalableLegacyCampaigns = async/, 'legacy campaign sync handler'],
];

for (const [pattern, label] of appHandlerChecks) {
  mustContain(appText, pattern, label, 'src/App.tsx');
}

const appWiringChecks = [
  [/onSaveScalableTemplate=\{handleSaveScalableTemplate\}/, 'template save callback wiring'],
  [/onCreateScalableTemplateSection=\{handleCreateScalableTemplateSection\}/, 'template section create callback wiring'],
  [/onUpdateScalableTemplateSection=\{handleUpdateScalableTemplateSection\}/, 'template section update callback wiring'],
  [/onReorderScalableTemplateSections=\{handleReorderScalableTemplateSections\}/, 'template section reorder callback wiring'],
  [/onDuplicateScalableTemplateSection=\{handleDuplicateScalableTemplateSection\}/, 'template section duplicate callback wiring'],
  [/onDeleteScalableTemplateSection=\{handleDeleteScalableTemplateSection\}/, 'template section delete callback wiring'],
  [/onSyncScalableTemplateSectionsFromLocality=\{handleSyncScalableTemplateSectionsFromLocality\}/, 'template locality sync callback wiring'],
  [/onSaveScalableAssignment=\{handleSaveScalableAssignment\}/, 'assignment save callback wiring'],
  [/onDeleteScalableAssignment=\{handleDeleteScalableAssignment\}/, 'assignment delete callback wiring'],
  [/onSaveScalableCampaign=\{handleSaveScalableCampaign\}/, 'campaign save callback wiring'],
  [/onDeleteScalableCampaign=\{handleDeleteScalableCampaign\}/, 'campaign delete callback wiring'],
  [/onRefreshScalablePublishedSnapshots=\{handleRefreshScalablePublishedSnapshots\}/, 'snapshot refresh callback wiring'],
  [/onDeleteScalablePublishedSnapshot=\{handleDeleteScalablePublishedSnapshot\}/, 'snapshot delete callback wiring'],
  [/onReseedScalableHomepageConfig=\{handleReseedScalableHomepageConfig\}/, 'reseed callback wiring'],
  [/onPublishResolvedHomepages=\{handlePublishResolvedHomepages\}/, 'publish callback wiring'],
  [/onDeleteResolvedHomepageSnapshots=\{handleDeleteResolvedHomepageSnapshots\}/, 'snapshot delete callback wiring'],
];

for (const [pattern, label] of appWiringChecks) {
  mustContain(appText, pattern, label, 'src/App.tsx');
}

const adminWorkflowChecks = [
  [/const handlePublishResolvedHomepages = async/, 'admin publish flow helper'],
  [/const handleReseedScalableHomepageConfig = async/, 'admin reseed flow helper'],
  [/const handleCreateScalableTemplateSection = async/, 'admin template section helper'],
  [/onClick=\{\(\) => handlePublishResolvedHomepages\(\[homepageLocalityId\]\)\}/, 'publish current locality action'],
  [/onClick=\{\(\) => handlePublishResolvedHomepages\(localities\.map\(\(locality\) => locality\.id\)\)\}/, 'publish all localities action'],
  [/No published snapshots yet\. Publish a locality to persist and inspect resolved payloads\./, 'published snapshot empty state'],
  [/Preview the final locality-aware payload returned by the resolver or published snapshot layer\./, 'preview guidance'],
];

for (const [pattern, label] of adminWorkflowChecks) {
  mustContain(adminConsoleText, pattern, label, 'src/components/AdminConsole.tsx');
}

console.log('Workflow publish smoke check passed.');
