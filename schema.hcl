table "account_emailaddress" {
  schema = schema.public
  column "id" {
    null = false
    type = integer
    identity {
      generated = BY_DEFAULT
    }
  }
  column "email" {
    null = false
    type = character_varying(254)
  }
  column "verified" {
    null = false
    type = boolean
  }
  column "primary" {
    null = false
    type = boolean
  }
  column "user_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "account_emailaddress_user_id_2c513194_fk_users_id" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "account_emailaddress_email_03be32b2" {
    columns = [column.email]
  }
  index "account_emailaddress_email_03be32b2_like" {
    on {
      column = column.email
      ops    = varchar_pattern_ops
    }
  }
  index "account_emailaddress_user_id_2c513194" {
    columns = [column.user_id]
  }
  index "unique_primary_email" {
    unique  = true
    columns = [column.user_id, column.primary]
    where   = "\"primary\""
  }
  index "unique_verified_email" {
    unique  = true
    columns = [column.email]
    where   = "verified"
  }
  unique "account_emailaddress_user_id_email_987c8728_uniq" {
    columns = [column.user_id, column.email]
  }
}
table "account_emailconfirmation" {
  schema = schema.public
  column "id" {
    null = false
    type = integer
    identity {
      generated = BY_DEFAULT
    }
  }
  column "created" {
    null = false
    type = timestamptz
  }
  column "sent" {
    null = true
    type = timestamptz
  }
  column "key" {
    null = false
    type = character_varying(64)
  }
  column "email_address_id" {
    null = false
    type = integer
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "account_emailconfirm_email_address_id_5b7f8c58_fk_account_e" {
    columns     = [column.email_address_id]
    ref_columns = [table.account_emailaddress.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "account_emailconfirmation_email_address_id_5b7f8c58" {
    columns = [column.email_address_id]
  }
  index "account_emailconfirmation_key_f43612bd_like" {
    on {
      column = column.key
      ops    = varchar_pattern_ops
    }
  }
  unique "account_emailconfirmation_key_key" {
    columns = [column.key]
  }
}
table "auth_group" {
  schema = schema.public
  column "id" {
    null = false
    type = integer
    identity {
      generated = BY_DEFAULT
    }
  }
  column "name" {
    null = false
    type = character_varying(150)
  }
  primary_key {
    columns = [column.id]
  }
  index "auth_group_name_a6ea08ec_like" {
    on {
      column = column.name
      ops    = varchar_pattern_ops
    }
  }
  unique "auth_group_name_key" {
    columns = [column.name]
  }
}
table "auth_group_permissions" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "group_id" {
    null = false
    type = integer
  }
  column "permission_id" {
    null = false
    type = integer
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "auth_group_permissio_permission_id_84c5c92e_fk_auth_perm" {
    columns     = [column.permission_id]
    ref_columns = [table.auth_permission.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  foreign_key "auth_group_permissions_group_id_b120cbf9_fk_auth_group_id" {
    columns     = [column.group_id]
    ref_columns = [table.auth_group.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "auth_group_permissions_group_id_b120cbf9" {
    columns = [column.group_id]
  }
  index "auth_group_permissions_permission_id_84c5c92e" {
    columns = [column.permission_id]
  }
  unique "auth_group_permissions_group_id_permission_id_0cd325b0_uniq" {
    columns = [column.group_id, column.permission_id]
  }
}
table "auth_permission" {
  schema = schema.public
  column "id" {
    null = false
    type = integer
    identity {
      generated = BY_DEFAULT
    }
  }
  column "name" {
    null = false
    type = character_varying(255)
  }
  column "content_type_id" {
    null = false
    type = integer
  }
  column "codename" {
    null = false
    type = character_varying(100)
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "auth_permission_content_type_id_2f476e4b_fk_django_co" {
    columns     = [column.content_type_id]
    ref_columns = [table.django_content_type.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "auth_permission_content_type_id_2f476e4b" {
    columns = [column.content_type_id]
  }
  unique "auth_permission_content_type_id_codename_01ab375a_uniq" {
    columns = [column.content_type_id, column.codename]
  }
}
table "authors" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "name" {
    null = false
    type = character_varying(1024)
  }
  column "bio" {
    null = true
    type = text
  }
  column "cover" {
    null = true
    type = character_varying(200)
  }
  primary_key {
    columns = [column.id]
  }
  index "authors_name_b87ae7ca_like" {
    on {
      column = column.name
      ops    = varchar_pattern_ops
    }
  }
  unique "authors_name_key" {
    columns = [column.name]
  }
}
table "authtoken_token" {
  schema = schema.public
  column "key" {
    null = false
    type = character_varying(40)
  }
  column "created" {
    null = false
    type = timestamptz
  }
  column "user_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.key]
  }
  foreign_key "authtoken_token_user_id_35299eff_fk_users_id" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "authtoken_token_key_10f0b77e_like" {
    on {
      column = column.key
      ops    = varchar_pattern_ops
    }
  }
  unique "authtoken_token_user_id_key" {
    columns = [column.user_id]
  }
}
table "books" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "title" {
    null = false
    type = character_varying(1024)
  }
  column "author_id" {
    null = true
    type = bigint
  }
  column "cover" {
    null = true
    type = character_varying(200)
  }
  column "created" {
    null = false
    type = timestamptz
  }
  column "description" {
    null = true
    type = text
  }
  column "isbn" {
    null = true
    type = character_varying(13)
  }
  column "language" {
    null = true
    type = character_varying(50)
  }
  column "pages" {
    null = true
    type = integer
  }
  column "published" {
    null = true
    type = date
  }
  column "publisher" {
    null = true
    type = character_varying(1024)
  }
  column "updated" {
    null = false
    type = timestamptz
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "books_author_id_c90d3b48_fk_authors_id" {
    columns     = [column.author_id]
    ref_columns = [table.authors.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "books_author_id_c90d3b48" {
    columns = [column.author_id]
  }
  index "books_title_6e7eff41_like" {
    on {
      column = column.title
      ops    = varchar_pattern_ops
    }
  }
  check "books_pages_check" {
    expr = "(pages >= 0)"
  }
  unique "books_title_key" {
    columns = [column.title]
  }
}
table "django_admin_log" {
  schema = schema.public
  column "id" {
    null = false
    type = integer
    identity {
      generated = BY_DEFAULT
    }
  }
  column "action_time" {
    null = false
    type = timestamptz
  }
  column "object_id" {
    null = true
    type = text
  }
  column "object_repr" {
    null = false
    type = character_varying(200)
  }
  column "action_flag" {
    null = false
    type = smallint
  }
  column "change_message" {
    null = false
    type = text
  }
  column "content_type_id" {
    null = true
    type = integer
  }
  column "user_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "django_admin_log_content_type_id_c4bce8eb_fk_django_co" {
    columns     = [column.content_type_id]
    ref_columns = [table.django_content_type.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  foreign_key "django_admin_log_user_id_c564eba6_fk_users_id" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "django_admin_log_content_type_id_c4bce8eb" {
    columns = [column.content_type_id]
  }
  index "django_admin_log_user_id_c564eba6" {
    columns = [column.user_id]
  }
  check "django_admin_log_action_flag_check" {
    expr = "(action_flag >= 0)"
  }
}
table "django_content_type" {
  schema = schema.public
  column "id" {
    null = false
    type = integer
    identity {
      generated = BY_DEFAULT
    }
  }
  column "app_label" {
    null = false
    type = character_varying(100)
  }
  column "model" {
    null = false
    type = character_varying(100)
  }
  primary_key {
    columns = [column.id]
  }
  unique "django_content_type_app_label_model_76bd3d3b_uniq" {
    columns = [column.app_label, column.model]
  }
}
table "django_migrations" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "app" {
    null = false
    type = character_varying(255)
  }
  column "name" {
    null = false
    type = character_varying(255)
  }
  column "applied" {
    null = false
    type = timestamptz
  }
  primary_key {
    columns = [column.id]
  }
}
table "django_session" {
  schema = schema.public
  column "session_key" {
    null = false
    type = character_varying(40)
  }
  column "session_data" {
    null = false
    type = text
  }
  column "expire_date" {
    null = false
    type = timestamptz
  }
  primary_key {
    columns = [column.session_key]
  }
  index "django_session_expire_date_a5c62663" {
    columns = [column.expire_date]
  }
  index "django_session_session_key_c0390e0f_like" {
    on {
      column = column.session_key
      ops    = varchar_pattern_ops
    }
  }
}
table "documents" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "file" {
    null = false
    type = character_varying(100)
  }
  column "title" {
    null = true
    type = character_varying(1024)
  }
  column "uploaded_at" {
    null = false
    type = timestamptz
  }
  column "processed" {
    null = false
    type = boolean
  }
  column "owner_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "documents_owner_id_ca725ac0_fk_users_id" {
    columns     = [column.owner_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "documents_owner_id_ca725ac0" {
    columns = [column.owner_id]
  }
}
table "import_logs" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "platform" {
    null = false
    type = character_varying(50)
  }
  column "file" {
    null = false
    type = character_varying(100)
  }
  column "created_at" {
    null = false
    type = timestamptz
  }
  column "status" {
    null = false
    type = character_varying(50)
  }
  column "owner_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "import_logs_owner_id_3c594c95_fk_users_id" {
    columns     = [column.owner_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "import_logs_owner_id_3c594c95" {
    columns = [column.owner_id]
  }
}
table "mfa_authenticator" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "type" {
    null = false
    type = character_varying(20)
  }
  column "data" {
    null = false
    type = jsonb
  }
  column "user_id" {
    null = false
    type = bigint
  }
  column "created_at" {
    null = false
    type = timestamptz
  }
  column "last_used_at" {
    null = true
    type = timestamptz
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "mfa_authenticator_user_id_0c3a50c0_fk_users_id" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "mfa_authenticator_user_id_0c3a50c0" {
    columns = [column.user_id]
  }
  index "unique_authenticator_type" {
    unique  = true
    columns = [column.user_id, column.type]
    where   = "((type)::text = ANY ((ARRAY['totp'::character varying, 'recovery_codes'::character varying])::text[]))"
  }
}
table "quote_group_memberships" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "role" {
    null = false
    type = character_varying(10)
  }
  column "joined" {
    null = false
    type = timestamptz
  }
  column "group_id" {
    null = false
    type = bigint
  }
  column "user_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "quote_group_memberships_group_id_63ea0a9f_fk_quote_groups_id" {
    columns     = [column.group_id]
    ref_columns = [table.quote_groups.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  foreign_key "quote_group_memberships_user_id_7b907284_fk_users_id" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "quote_group_memberships_group_id_63ea0a9f" {
    columns = [column.group_id]
  }
  index "quote_group_memberships_user_id_7b907284" {
    columns = [column.user_id]
  }
  unique "quote_group_memberships_user_id_group_id_19cc4adb_uniq" {
    columns = [column.user_id, column.group_id]
  }
}
table "quote_group_shares" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "permission" {
    null = false
    type = character_varying(10)
  }
  column "shared_at" {
    null = false
    type = timestamptz
  }
  column "group_id" {
    null = false
    type = bigint
  }
  column "quote_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "quote_group_shares_group_id_99b03dc5_fk_quote_groups_id" {
    columns     = [column.group_id]
    ref_columns = [table.quote_groups.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  foreign_key "quote_group_shares_quote_id_cfb1e7b7_fk_quotes_id" {
    columns     = [column.quote_id]
    ref_columns = [table.quotes.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "quote_group_shares_group_id_99b03dc5" {
    columns = [column.group_id]
  }
  index "quote_group_shares_quote_id_cfb1e7b7" {
    columns = [column.quote_id]
  }
  unique "quote_group_shares_quote_id_group_id_93073fce_uniq" {
    columns = [column.quote_id, column.group_id]
  }
}
table "quote_groups" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "name" {
    null = false
    type = character_varying(255)
  }
  column "description" {
    null = true
    type = text
  }
  column "created" {
    null = false
    type = timestamptz
  }
  column "created_by_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "quote_groups_created_by_id_c7878035_fk_users_id" {
    columns     = [column.created_by_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "quote_groups_created_by_id_c7878035" {
    columns = [column.created_by_id]
  }
  index "quote_groups_name_8b9fc919_like" {
    on {
      column = column.name
      ops    = varchar_pattern_ops
    }
  }
  unique "quote_groups_name_key" {
    columns = [column.name]
  }
}
table "quote_list_quotes" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "quote_id" {
    null = false
    type = bigint
  }
  column "quote_list_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "quote_list_quotes_quote_id_f2653c36_fk_quotes_id" {
    columns     = [column.quote_id]
    ref_columns = [table.quotes.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  foreign_key "quote_list_quotes_quote_list_id_a2407cf6_fk_quote_lists_id" {
    columns     = [column.quote_list_id]
    ref_columns = [table.quote_lists.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "quote_list_quotes_quote_id_f2653c36" {
    columns = [column.quote_id]
  }
  index "quote_list_quotes_quote_list_id_a2407cf6" {
    columns = [column.quote_list_id]
  }
  unique "quote_list_quotes_quote_list_id_quote_id_e4353649_uniq" {
    columns = [column.quote_list_id, column.quote_id]
  }
}
table "quote_lists" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "title" {
    null = false
    type = character_varying(1024)
  }
  column "description" {
    null = true
    type = text
  }
  column "visibility" {
    null = false
    type = character_varying(10)
  }
  column "created" {
    null = false
    type = timestamptz
  }
  column "updated" {
    null = false
    type = timestamptz
  }
  column "group_id" {
    null = true
    type = bigint
  }
  column "owner_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "quote_lists_group_id_8154df62_fk_quote_groups_id" {
    columns     = [column.group_id]
    ref_columns = [table.quote_groups.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  foreign_key "quote_lists_owner_id_6c6cd8d8_fk_users_id" {
    columns     = [column.owner_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "quote_lists_group_id_8154df62" {
    columns = [column.group_id]
  }
  index "quote_lists_owner_id_6c6cd8d8" {
    columns = [column.owner_id]
  }
}
table "quote_lists_quotes" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "quotelist_id" {
    null = false
    type = bigint
  }
  column "quote_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "quote_lists_quotes_quote_id_80b2e0be_fk_quotes_id" {
    columns     = [column.quote_id]
    ref_columns = [table.quotes.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  foreign_key "quote_lists_quotes_quotelist_id_5bf8b88a_fk_quote_lists_id" {
    columns     = [column.quotelist_id]
    ref_columns = [table.quote_lists.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "quote_lists_quotes_quote_id_80b2e0be" {
    columns = [column.quote_id]
  }
  index "quote_lists_quotes_quotelist_id_5bf8b88a" {
    columns = [column.quotelist_id]
  }
  unique "quote_lists_quotes_quotelist_id_quote_id_7ae3c08e_uniq" {
    columns = [column.quotelist_id, column.quote_id]
  }
}
table "quote_tags" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "quote_id" {
    null = false
    type = bigint
  }
  column "tag_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "quote_tags_quote_id_40841e57_fk_quotes_id" {
    columns     = [column.quote_id]
    ref_columns = [table.quotes.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  foreign_key "quote_tags_tag_id_13b10dfb_fk_tags_id" {
    columns     = [column.tag_id]
    ref_columns = [table.tags.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "quote_tags_quote_id_40841e57" {
    columns = [column.quote_id]
  }
  index "quote_tags_tag_id_13b10dfb" {
    columns = [column.tag_id]
  }
  unique "quote_tags_quote_id_tag_id_15a9ca58_uniq" {
    columns = [column.quote_id, column.tag_id]
  }
}
table "quotes" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "title" {
    null = false
    type = character_varying(1024)
  }
  column "body" {
    null = true
    type = text
  }
  column "archive" {
    null = false
    type = boolean
  }
  column "created" {
    null = false
    type = date
  }
  column "updated" {
    null = false
    type = date
  }
  column "hash" {
    null = true
    type = character_varying(50)
  }
  column "location" {
    null = true
    type = character_varying(256)
  }
  column "source_platform" {
    null = true
    type = character_varying(50)
  }
  column "book_id" {
    null = true
    type = bigint
  }
  column "owner_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "quotes_book_id_0815f1de_fk_books_id" {
    columns     = [column.book_id]
    ref_columns = [table.books.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  foreign_key "quotes_owner_id_92a5c699_fk_users_id" {
    columns     = [column.owner_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "quotes_book_id_0815f1de" {
    columns = [column.book_id]
  }
  index "quotes_hash_f5578231" {
    columns = [column.hash]
  }
  index "quotes_hash_f5578231_like" {
    on {
      column = column.hash
      ops    = varchar_pattern_ops
    }
  }
  index "quotes_owner_id_92a5c699" {
    columns = [column.owner_id]
  }
}
table "quotes_tags" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "quote_id" {
    null = false
    type = bigint
  }
  column "tag_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "quotes_tags_quote_id_8af2f69b_fk_quotes_id" {
    columns     = [column.quote_id]
    ref_columns = [table.quotes.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  foreign_key "quotes_tags_tag_id_eab4f383_fk_tags_id" {
    columns     = [column.tag_id]
    ref_columns = [table.tags.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "quotes_tags_quote_id_8af2f69b" {
    columns = [column.quote_id]
  }
  index "quotes_tags_tag_id_eab4f383" {
    columns = [column.tag_id]
  }
  unique "quotes_tags_quote_id_tag_id_0afa2781_uniq" {
    columns = [column.quote_id, column.tag_id]
  }
}
table "socialaccount_socialaccount" {
  schema = schema.public
  column "id" {
    null = false
    type = integer
    identity {
      generated = BY_DEFAULT
    }
  }
  column "provider" {
    null = false
    type = character_varying(200)
  }
  column "uid" {
    null = false
    type = character_varying(191)
  }
  column "last_login" {
    null = false
    type = timestamptz
  }
  column "date_joined" {
    null = false
    type = timestamptz
  }
  column "extra_data" {
    null = false
    type = jsonb
  }
  column "user_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "socialaccount_socialaccount_user_id_8146e70c_fk_users_id" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "socialaccount_socialaccount_user_id_8146e70c" {
    columns = [column.user_id]
  }
  unique "socialaccount_socialaccount_provider_uid_fc810c6e_uniq" {
    columns = [column.provider, column.uid]
  }
}
table "socialaccount_socialapp" {
  schema = schema.public
  column "id" {
    null = false
    type = integer
    identity {
      generated = BY_DEFAULT
    }
  }
  column "provider" {
    null = false
    type = character_varying(30)
  }
  column "name" {
    null = false
    type = character_varying(40)
  }
  column "client_id" {
    null = false
    type = character_varying(191)
  }
  column "secret" {
    null = false
    type = character_varying(191)
  }
  column "key" {
    null = false
    type = character_varying(191)
  }
  column "provider_id" {
    null = false
    type = character_varying(200)
  }
  column "settings" {
    null = false
    type = jsonb
  }
  primary_key {
    columns = [column.id]
  }
}
table "socialaccount_socialtoken" {
  schema = schema.public
  column "id" {
    null = false
    type = integer
    identity {
      generated = BY_DEFAULT
    }
  }
  column "token" {
    null = false
    type = text
  }
  column "token_secret" {
    null = false
    type = text
  }
  column "expires_at" {
    null = true
    type = timestamptz
  }
  column "account_id" {
    null = false
    type = integer
  }
  column "app_id" {
    null = true
    type = integer
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "socialaccount_social_account_id_951f210e_fk_socialacc" {
    columns     = [column.account_id]
    ref_columns = [table.socialaccount_socialaccount.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  foreign_key "socialaccount_social_app_id_636a42d7_fk_socialacc" {
    columns     = [column.app_id]
    ref_columns = [table.socialaccount_socialapp.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "socialaccount_socialtoken_account_id_951f210e" {
    columns = [column.account_id]
  }
  index "socialaccount_socialtoken_app_id_636a42d7" {
    columns = [column.app_id]
  }
  unique "socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq" {
    columns = [column.app_id, column.account_id]
  }
}
table "tags" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "title" {
    null = false
    type = character_varying(50)
  }
  column "description" {
    null = true
    type = character_varying(1024)
  }
  primary_key {
    columns = [column.id]
  }
  index "tags_title_14a4130c_like" {
    on {
      column = column.title
      ops    = varchar_pattern_ops
    }
  }
  unique "tags_title_key" {
    columns = [column.title]
  }
}
table "users" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "password" {
    null = false
    type = character_varying(128)
  }
  column "last_login" {
    null = true
    type = timestamptz
  }
  column "is_superuser" {
    null = false
    type = boolean
  }
  column "username" {
    null = false
    type = character_varying(150)
  }
  column "first_name" {
    null = false
    type = character_varying(30)
  }
  column "last_name" {
    null = false
    type = character_varying(150)
  }
  column "email" {
    null = false
    type = character_varying(254)
  }
  column "is_staff" {
    null = false
    type = boolean
  }
  column "is_active" {
    null = false
    type = boolean
  }
  column "date_joined" {
    null = false
    type = timestamptz
  }
  primary_key {
    columns = [column.id]
  }
  index "users_email_0ea73cca_like" {
    on {
      column = column.email
      ops    = varchar_pattern_ops
    }
  }
  index "users_username_e8658fc8_like" {
    on {
      column = column.username
      ops    = varchar_pattern_ops
    }
  }
  unique "users_email_0ea73cca_uniq" {
    columns = [column.email]
  }
  unique "users_username_key" {
    columns = [column.username]
  }
}
table "users_groups" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "user_id" {
    null = false
    type = bigint
  }
  column "group_id" {
    null = false
    type = integer
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "users_groups_group_id_2f3517aa_fk_auth_group_id" {
    columns     = [column.group_id]
    ref_columns = [table.auth_group.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  foreign_key "users_groups_user_id_f500bee5_fk_users_id" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "users_groups_group_id_2f3517aa" {
    columns = [column.group_id]
  }
  index "users_groups_user_id_f500bee5" {
    columns = [column.user_id]
  }
  unique "users_groups_user_id_group_id_fc7788e8_uniq" {
    columns = [column.user_id, column.group_id]
  }
}
table "users_user_permissions" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "user_id" {
    null = false
    type = bigint
  }
  column "permission_id" {
    null = false
    type = integer
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "users_user_permissio_permission_id_6d08dcd2_fk_auth_perm" {
    columns     = [column.permission_id]
    ref_columns = [table.auth_permission.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  foreign_key "users_user_permissions_user_id_92473840_fk_users_id" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "users_user_permissions_permission_id_6d08dcd2" {
    columns = [column.permission_id]
  }
  index "users_user_permissions_user_id_92473840" {
    columns = [column.user_id]
  }
  unique "users_user_permissions_user_id_permission_id_3b86cbdf_uniq" {
    columns = [column.user_id, column.permission_id]
  }
}
table "usersessions_usersession" {
  schema = schema.public
  column "id" {
    null = false
    type = bigint
    identity {
      generated = BY_DEFAULT
    }
  }
  column "created_at" {
    null = false
    type = timestamptz
  }
  column "ip" {
    null = false
    type = inet
  }
  column "last_seen_at" {
    null = false
    type = timestamptz
  }
  column "session_key" {
    null = false
    type = character_varying(40)
  }
  column "user_agent" {
    null = false
    type = character_varying(200)
  }
  column "data" {
    null = false
    type = jsonb
  }
  column "user_id" {
    null = false
    type = bigint
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "usersessions_usersession_user_id_af5e0a6d_fk_users_id" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
    deferrable  = INITIALLY_DEFERRED
  }
  index "usersessions_usersession_session_key_fd35de43_like" {
    on {
      column = column.session_key
      ops    = varchar_pattern_ops
    }
  }
  index "usersessions_usersession_user_id_af5e0a6d" {
    columns = [column.user_id]
  }
  unique "usersessions_usersession_session_key_key" {
    columns = [column.session_key]
  }
}
schema "public" {
  comment = "standard public schema"
}
