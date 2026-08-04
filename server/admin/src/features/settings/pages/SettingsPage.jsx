import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Shield,
  Palette,
  FlaskConical,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
  ChevronRight,
  Lock,
  Sun,
  Moon,
  Monitor,
  Clock,
  User,
  BookOpen,
  Accessibility,
} from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Switch } from '../../../components/ui/Switch';
import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';

import { settingsApi } from '../api/settingsApi';
import { queryKeys } from '../../../utils/queryKeys';
import { useToast } from '../../../hooks/useToast';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert a flat settings list into a key→value lookup map. */
const toMap = (settingsList = []) =>
  Object.fromEntries((settingsList).map((s) => [s.key, s.value ?? '']));

/** Build a key→value patch from current form values vs original values. */
const buildDiff = (original, current) => {
  const diff = {};
  for (const [key, value] of Object.entries(current)) {
    if (String(original[key] ?? '') !== String(value ?? '')) {
      diff[key] = value === '' ? null : String(value);
    }
  }
  return diff;
};

// ─── Section Navigation Items ────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    id: 'institution',
    label: 'Institution',
    icon: Building2,
    description: 'Name, branding, and exam defaults',
    category: 'institution',
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    description: 'Passwords, sessions, and access',
    category: 'security',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Theme and dashboard branding',
    category: 'appearance',
  },
  {
    id: 'exam',
    label: 'Examination',
    icon: BookOpen,
    description: 'Pass thresholds and exam behaviour',
    category: 'exam',
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    icon: Accessibility,
    description: 'Accessibility profiles and preferences',
    category: null, // reserved
    reserved: true,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Info,
    description: 'Email and system notification settings',
    category: null,
    reserved: true,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: FlaskConical,
    description: 'Third-party service connections',
    category: null,
    reserved: true,
  },
];

// ─── Reusable sub-components ─────────────────────────────────────────────────

const SettingRow = ({ label, description, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-5 border-b border-border-main last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-text-main">{label}</p>
      {description && <p className="mt-0.5 text-xs text-text-muted leading-relaxed">{description}</p>}
    </div>
    <div className="shrink-0 w-full sm:w-72">{children}</div>
  </div>
);

const SectionHeading = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3 mb-6">
    <div className="p-2 rounded-lg bg-navy-tint shrink-0">
      <Icon className="w-5 h-5 text-navy-primary" aria-hidden="true" />
    </div>
    <div>
      <h2 className="text-lg font-bold text-text-main">{title}</h2>
      {description && <p className="text-sm text-text-muted mt-0.5">{description}</p>}
    </div>
  </div>
);

const ReservedSection = ({ icon: Icon, label, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-4 rounded-full bg-subtle border border-border-main mb-4">
      <Icon className="w-8 h-8 text-text-muted" aria-hidden="true" />
    </div>
    <h3 className="text-base font-semibold text-text-main">{label} Settings</h3>
    <p className="mt-2 text-sm text-text-muted max-w-sm">{description}</p>
    <Badge variant="amber" className="mt-4">Coming in a Future Release</Badge>
  </div>
);

// ─── Section Panels ──────────────────────────────────────────────────────────

const InstitutionSection = ({ values, onChange }) => (
  <>
    <SectionHeading
      icon={Building2}
      title="Institution Settings"
      description="Configure your institution's identity and examination defaults."
    />
    <SettingRow
      label="Institution Name"
      description="The official name shown on the dashboard and examination platform."
    >
      <Input
        name="institution.name"
        value={values['institution.name'] ?? ''}
        onChange={(e) => onChange('institution.name', e.target.value)}
        placeholder="e.g. St. Xavier's College"
        aria-label="Institution name"
      />
    </SettingRow>
    <SettingRow
      label="Logo URL"
      description="Public URL to your institution's logo. Displayed in the header when enabled."
    >
      <Input
        name="institution.logo_url"
        value={values['institution.logo_url'] ?? ''}
        onChange={(e) => onChange('institution.logo_url', e.target.value)}
        placeholder="https://example.com/logo.png"
        type="url"
        aria-label="Institution logo URL"
      />
    </SettingRow>
    <SettingRow
      label="Default Examination Duration"
      description="The default duration (in minutes) applied when creating a new examination."
    >
      <Input
        name="institution.default_exam_duration"
        value={values['institution.default_exam_duration'] ?? ''}
        onChange={(e) => onChange('institution.default_exam_duration', e.target.value)}
        type="number"
        min="5"
        max="480"
        placeholder="60"
        aria-label="Default examination duration in minutes"
      />
    </SettingRow>
    <SettingRow
      label="Contact Email"
      description="Administrative contact email for institution-level communications."
    >
      <Input
        name="institution.contact_email"
        value={values['institution.contact_email'] ?? ''}
        onChange={(e) => onChange('institution.contact_email', e.target.value)}
        type="email"
        placeholder="admin@college.edu"
        aria-label="Institution contact email"
      />
    </SettingRow>
  </>
);

const SecuritySection = ({ values, onChange }) => (
  <>
    <SectionHeading
      icon={Shield}
      title="Security Settings"
      description="Password policies and session management for administrator accounts."
    />

    <div className="mb-4">
      <p className="text-xs font-bold uppercase tracking-wider text-navy-primary mb-3">Password Policy</p>
    </div>

    <SettingRow
      label="Minimum Password Length"
      description="The minimum number of characters required for administrator passwords."
    >
      <Input
        name="security.password_min_length"
        value={values['security.password_min_length'] ?? '8'}
        onChange={(e) => onChange('security.password_min_length', e.target.value)}
        type="number"
        min="6"
        max="64"
        aria-label="Minimum password length"
      />
    </SettingRow>
    <SettingRow
      label="Require Uppercase Letter"
      description="Passwords must contain at least one uppercase letter (A–Z)."
    >
      <Switch
        id="security.password_require_uppercase"
        checked={values['security.password_require_uppercase'] === 'true'}
        onChange={() =>
          onChange(
            'security.password_require_uppercase',
            values['security.password_require_uppercase'] === 'true' ? 'false' : 'true'
          )
        }
        label={values['security.password_require_uppercase'] === 'true' ? 'Required' : 'Not required'}
      />
    </SettingRow>
    <SettingRow
      label="Require Numeric Character"
      description="Passwords must contain at least one number (0–9)."
    >
      <Switch
        id="security.password_require_number"
        checked={values['security.password_require_number'] === 'true'}
        onChange={() =>
          onChange(
            'security.password_require_number',
            values['security.password_require_number'] === 'true' ? 'false' : 'true'
          )
        }
        label={values['security.password_require_number'] === 'true' ? 'Required' : 'Not required'}
      />
    </SettingRow>
    <SettingRow
      label="Require Special Character"
      description="Passwords must contain at least one special character (e.g. !@#$%)."
    >
      <Switch
        id="security.password_require_special"
        checked={values['security.password_require_special'] === 'true'}
        onChange={() =>
          onChange(
            'security.password_require_special',
            values['security.password_require_special'] === 'true' ? 'false' : 'true'
          )
        }
        label={values['security.password_require_special'] === 'true' ? 'Required' : 'Not required'}
      />
    </SettingRow>

    <div className="mt-6 mb-4">
      <p className="text-xs font-bold uppercase tracking-wider text-navy-primary mb-3">Session Management</p>
    </div>

    <SettingRow
      label="Administrator Session Timeout"
      description="Number of minutes of inactivity before an administrator session expires automatically."
    >
      <Input
        name="security.session_timeout_minutes"
        value={values['security.session_timeout_minutes'] ?? '120'}
        onChange={(e) => onChange('security.session_timeout_minutes', e.target.value)}
        type="number"
        min="15"
        max="1440"
        aria-label="Session timeout in minutes"
      />
    </SettingRow>
    <SettingRow
      label="Maximum Login Attempts"
      description="Number of failed login attempts before an account is temporarily locked out."
    >
      <Input
        name="security.max_login_attempts"
        value={values['security.max_login_attempts'] ?? '5'}
        onChange={(e) => onChange('security.max_login_attempts', e.target.value)}
        type="number"
        min="3"
        max="20"
        aria-label="Maximum login attempts"
      />
    </SettingRow>
  </>
);

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Follow system preference' },
];

const AppearanceSection = ({ values, onChange }) => {
  const theme = values['appearance.theme'] ?? 'system';

  return (
    <>
      <SectionHeading
        icon={Palette}
        title="Appearance Settings"
        description="Customise the dashboard theme and institutional branding display."
      />
      <SettingRow
        label="Dashboard Theme"
        description="Choose between a light, dark, or system-adaptive colour theme for the admin dashboard."
      >
        <div className="space-y-2">
          <Select
            name="appearance.theme"
            value={theme}
            onChange={(e) => onChange('appearance.theme', e.target.value)}
            options={THEME_OPTIONS}
            aria-label="Dashboard theme"
          />
          <div className="flex gap-2 mt-2">
            {[
              { val: 'light', icon: Sun, label: 'Light' },
              { val: 'dark', icon: Moon, label: 'Dark' },
              { val: 'system', icon: Monitor, label: 'System' },
            ].map(({ val, icon: Icon, label }) => (
              <button
                key={val}
                type="button"
                aria-pressed={theme === val}
                onClick={() => onChange('appearance.theme', val)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                  theme === val
                    ? 'border-navy-primary bg-navy-tint text-navy-primary'
                    : 'border-border-main text-text-muted hover:border-border-strong hover:text-text-main'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </SettingRow>
      <SettingRow
        label="Show Institution Logo"
        description="Display the institution logo in the dashboard navigation header."
      >
        <Switch
          id="appearance.show_institution_logo"
          checked={values['appearance.show_institution_logo'] === 'true'}
          onChange={() =>
            onChange(
              'appearance.show_institution_logo',
              values['appearance.show_institution_logo'] === 'true' ? 'false' : 'true'
            )
          }
          label={values['appearance.show_institution_logo'] === 'true' ? 'Displayed' : 'Hidden'}
        />
      </SettingRow>
      <SettingRow
        label="Primary Colour Token"
        description="The primary brand colour used for navigation and interactive elements."
      >
        <Select
          name="appearance.primary_color"
          value={values['appearance.primary_color'] ?? 'navy'}
          onChange={(e) => onChange('appearance.primary_color', e.target.value)}
          options={[
            { value: 'navy', label: 'Navy Blue (Default)' },
            { value: 'indigo', label: 'Indigo' },
            { value: 'teal', label: 'Teal' },
            { value: 'emerald', label: 'Emerald' },
          ]}
          aria-label="Primary colour token"
        />
      </SettingRow>
    </>
  );
};

const ExamSection = ({ values, onChange }) => (
  <>
    <SectionHeading
      icon={BookOpen}
      title="Examination Settings"
      description="Configure pass/fail thresholds and candidate result review behaviour."
    />
    <SettingRow
      label="Pass Threshold (%)"
      description="Minimum percentage a candidate must score to be considered passing. Used by the Results module."
    >
      <Input
        name="exam.pass_threshold_percentage"
        value={values['exam.pass_threshold_percentage'] ?? '40'}
        onChange={(e) => onChange('exam.pass_threshold_percentage', e.target.value)}
        type="number"
        min="0"
        max="100"
        aria-label="Pass threshold percentage"
      />
    </SettingRow>
    <SettingRow
      label="Allow Candidates to Review Results"
      description="When enabled, candidates can view their results after publication in the exam client."
    >
      <Switch
        id="exam.allow_result_review"
        checked={values['exam.allow_result_review'] === 'true'}
        onChange={() =>
          onChange(
            'exam.allow_result_review',
            values['exam.allow_result_review'] === 'true' ? 'false' : 'true'
          )
        }
        label={values['exam.allow_result_review'] === 'true' ? 'Allowed' : 'Disabled'}
      />
    </SettingRow>
  </>
);

// ─── Main Settings Page ──────────────────────────────────────────────────────

/**
 * System Settings Page
 * Provides a sidebar-navigated, categorised settings interface.
 * Architecture is intentionally extensible: add a new NAV_ITEM and Section panel to extend.
 * All settings persist to the backend via bulk PATCH on save.
 */
export const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeSection, setActiveSection] = useState('institution');
  const [localValues, setLocalValues] = useState({});
  const [savedValues, setSavedValues] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Fetch all settings grouped by category
  const settingsQuery = useQuery({
    queryKey: queryKeys.settings.grouped,
    queryFn: ({ signal }) => settingsApi.getGrouped({ signal }),
  });

  // Flatten grouped settings into a single key→value map on load
  useEffect(() => {
    if (settingsQuery.data?.categories) {
      const flat = {};
      for (const settingsList of Object.values(settingsQuery.data.categories)) {
        Object.assign(flat, toMap(settingsList));
      }
      setLocalValues(flat);
      setSavedValues(flat);
      setIsDirty(false);
    }
  }, [settingsQuery.data]);

  const handleChange = useCallback((key, value) => {
    setLocalValues((prev) => {
      const next = { ...prev, [key]: value };
      // Compare with saved to detect dirtiness
      return next;
    });
    setIsDirty(true);
  }, []);

  // Recalculate dirty state whenever localValues changes
  useEffect(() => {
    const diff = buildDiff(savedValues, localValues);
    setIsDirty(Object.keys(diff).length > 0);
  }, [localValues, savedValues]);

  // Save mutation — sends only changed keys
  const saveMutation = useMutation({
    mutationFn: () => {
      const diff = buildDiff(savedValues, localValues);
      if (Object.keys(diff).length === 0) return Promise.resolve([]);
      return settingsApi.bulkUpdate(diff);
    },
    onSuccess: (updated) => {
      // Update savedValues to current localValues
      setSavedValues({ ...localValues });
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      const count = Array.isArray(updated) ? updated.length : 0;
      toastSuccess(count > 0 ? `${count} setting(s) saved successfully.` : 'No changes to save.');
    },
    onError: (err) => {
      toastError(err?.message || 'Failed to save settings. Please try again.');
    },
  });

  const handleReset = () => {
    setLocalValues({ ...savedValues });
    setIsDirty(false);
  };

  const activeNav = NAV_ITEMS.find((n) => n.id === activeSection) ?? NAV_ITEMS[0];

  const renderSection = () => {
    if (activeNav.reserved) {
      return (
        <ReservedSection
          icon={activeNav.icon}
          label={activeNav.label}
          description={`${activeNav.description}. This configuration category is reserved for a future TeioOS release.`}
        />
      );
    }

    if (settingsQuery.isLoading) return <LoadingSkeleton rows={6} />;
    if (settingsQuery.isError) {
      return (
        <Alert variant="error">
          System settings could not be loaded. Please reload the page.
        </Alert>
      );
    }

    switch (activeSection) {
      case 'institution':
        return <InstitutionSection values={localValues} onChange={handleChange} />;
      case 'security':
        return <SecuritySection values={localValues} onChange={handleChange} />;
      case 'appearance':
        return <AppearanceSection values={localValues} onChange={handleChange} />;
      case 'exam':
        return <ExamSection values={localValues} onChange={handleChange} />;
      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader
        title="System Settings"
        description="Configure institution identity, security policies, appearance, and examination behaviour."
        actions={
          !activeNav.reserved && (
            <div className="flex items-center gap-2">
              {isDirty && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleReset}
                  isDisabled={saveMutation.isPending}
                  aria-label="Discard changes"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  Discard
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={() => saveMutation.mutate()}
                isLoading={saveMutation.isPending}
                isDisabled={!isDirty || saveMutation.isPending}
                aria-label="Save settings"
              >
                <Save className="w-4 h-4 mr-1.5" aria-hidden="true" />
                Save Changes
              </Button>
            </div>
          )
        }
      />

      {isDirty && !activeNav.reserved && (
        <Alert variant="warning" className="mb-5">
          You have unsaved changes. Click <strong>Save Changes</strong> to persist them.
        </Alert>
      )}

      <div className="flex gap-6 items-start">
        {/* Sidebar Navigation */}
        <nav
          aria-label="Settings sections"
          className="w-56 shrink-0 sticky top-6"
        >
          <Card className="overflow-hidden">
            <ul role="list" className="divide-y divide-border-main">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-navy-tint text-navy-primary font-semibold'
                          : 'text-text-muted hover:bg-subtle hover:text-text-main'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.reserved && (
                        <span className="text-[10px] font-bold text-status-warning uppercase tracking-wide">Soon</span>
                      )}
                      {isActive && !item.reserved && (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </nav>

        {/* Main Settings Panel */}
        <main className="flex-1 min-w-0" aria-live="polite" aria-atomic="false">
          <Card>
            <CardBody className="p-6">
              {renderSection()}
            </CardBody>

            {!activeNav.reserved && !settingsQuery.isLoading && !settingsQuery.isError && (
              <CardFooter className="flex items-center justify-between px-6 py-4">
                <p className="text-xs text-text-muted">
                  {isDirty ? 'Unsaved changes present.' : (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-success" aria-hidden="true" />
                      All settings saved.
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    isDisabled={!isDirty || saveMutation.isPending}
                    aria-label="Discard changes"
                  >
                    Discard
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => saveMutation.mutate()}
                    isLoading={saveMutation.isPending}
                    isDisabled={!isDirty || saveMutation.isPending}
                    aria-label="Save settings changes"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    Save Changes
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </main>
      </div>
    </>
  );
};

export default SettingsPage;
