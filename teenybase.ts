import {
    DatabaseSettings,
    TableData,
    TableAuthExtensionData,
    TableRulesExtensionData,
    TableFieldDataType, TableFieldSqlDataType0, TableFieldSqlDataType1
} from "teenybase"
import {baseFields, authFields} from "teenybase/scaffolds/fields";

const userTable: TableData = {
    name: "users",
    // lastName: "users",
    // r2Base: "users",
    fields: [
        ...baseFields,
        ...authFields,
    ],
    extensions: [
        {
            name: "rules",
            listRule: "(auth.uid == id) | auth.role ~ '%admin'",
            viewRule: "(auth.uid == id) | auth.role ~ '%admin'",
            createRule: "(auth.uid == null & role == 'guest') | (auth.role ~ '%admin' & role != 'superadmin')",
            updateRule: "(auth.uid == id & role == new.role & meta == new.meta) | (auth.role ~ '%admin' & new.role != 'superadmin' & (role != 'superadmin' | auth.role = 'superadmin'))",
            deleteRule: "auth.role ~ '%admin' & role !~ '%admin'",
        } as TableRulesExtensionData,
        {
            name: "auth",
            passwordType: "sha256",
            passwordCurrentSuffix: "Current",
            passwordConfirmSuffix: "Confirm",
            jwtSecret: "$JWT_SECRET_USERS",
            jwtTokenDuration: 3 * 60 * 60, // 3 hours
            maxTokenRefresh: 4, // 12 hours
            emailTemplates: {
                verification: {
                    variables: {
                        message_title: 'Email Verification',
                        message_description: 'Welcome to {{APP_NAME}}. Click the button below to verify your email address.',
                        message_footer: 'If you did not request this, please ignore this email.',
                        action_text: 'Verify Email',
                        action_link: '{{APP_URL}}#/verify-email/{{TOKEN}}',
                    }
                },
                passwordReset: {
                    variables: {
                        message_title: 'Password Reset',
                        message_description: 'Click the button below to reset your password for your {{APP_NAME}} account.',
                        message_footer: 'If you did not request this, you can safely ignore this email.',
                        action_text: 'Reset Password',
                        action_link: '{{APP_URL}}#/reset-password/{{TOKEN}}',
                    }
                }
            }
        } as TableAuthExtensionData,
    ],
    autoSetUid: true,
}
const notesTable: TableData = {
    name: "notes",
    autoSetUid: true,
    fields: [
        ...baseFields,
        {name: "owner_id", type: TableFieldDataType.relation, sqlType: TableFieldSqlDataType0.text, notNull: true, foreignKey: {table: "users", column: "id"}},
        {name: "title", type: TableFieldDataType.text, sqlType: TableFieldSqlDataType0.text, notNull: true},
        {name: "content", type: TableFieldDataType.text, sqlType: TableFieldSqlDataType0.text, notNull: true},
        {name: "is_public", type: TableFieldDataType.bool, sqlType: TableFieldSqlDataType1.boolean, notNull: true, default: 'false'},
        {name: "slug", type: TableFieldDataType.text, sqlType: TableFieldSqlDataType0.text, unique: true, notNull: true},
        {name: "tags", type: TableFieldDataType.text, sqlType: TableFieldSqlDataType0.text},
        {name: "meta", type: TableFieldDataType.json, sqlType: TableFieldSqlDataType1.json},
        {name: "views", type: TableFieldDataType.number, sqlType: TableFieldSqlDataType0.integer, noUpdate: true, noInsert: true, default: "0"},
        {name: "archived", type: TableFieldDataType.bool, sqlType: TableFieldSqlDataType1.boolean, noInsert: true, default: "false"},
        {name: "deleted_at", type: TableFieldDataType.date, sqlType: TableFieldSqlDataType1.timestamp, noInsert: true, default: "false"},
    ],
    extensions: [
        {
            name: "rules",
            // Can view if note is public or if user owns it or is admin
            viewRule: "(is_public = true & !deleted_at & !archived) | auth.role ~ '%admin' | (auth.uid != null & owner_id == auth.uid)",
            // Cannot list if note is public but can list if user owns it or is admin
            // todo add count limit
            listRule: "(is_public & !deleted_at & !archived) | auth.role ~ '%admin' | (auth.uid != null & owner_id == auth.uid)",
            // Can create if authenticated and setting self as owner
            createRule: "auth.uid != null & owner_id == auth.uid",
            // Can update if owner and not changing ownership
            updateRule: "auth.uid != null & owner_id == auth.uid & owner_id = new.owner_id",
            // Can delete if owner or admin
            deleteRule: "auth.role ~ '%admin' | (auth.uid != null & owner_id == auth.uid)",
        } as TableRulesExtensionData,
    ],
}

export default {
    tables: [userTable, notesTable],
    appName: "Teeny Notes app",
    appUrl: "https://notes.teenybase.com",
    jwtSecret: "$JWT_SECRET_MAIN",
    email: {
        from: "Sender Name <noreply@example.com>",
        tags: ["tag-1"],
        variables: {
            company_name: "Company",
            company_copyright: "Company",
            company_address: "Company address",
            support_email: "support@example.com",
            company_url: "https://example.com",
        },
        mailgun: {
            MAILGUN_API_SERVER: "mail.example.com",
            // MAILGUN_API_URL: "https://api.mailgun.net/v3/"
            MAILGUN_API_KEY: "xxxxxx-xxxxxx-xxxxxxx",
            MAILGUN_WEBHOOK_SIGNING_KEY: "aaaaa",
            DISCORD_MAILGUN_NOTIFY_WEBHOOK: "xxxx"
            // EMAIL_BLOCKLIST: "a.com,b.com" // comma separated list of domains
        },
    },
} satisfies DatabaseSettings