import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context
from dotenv import load_dotenv

# =================================================================
# ===                 START OF CUSTOM CHANGES                   ===
# =================================================================

# 1. Load environment variables from .env file
#    Humne .env file se DATABASE_URL load karne ke liye yeh add kiya hai.
load_dotenv()

# 2. Import your models' Base
#    Alembic ko aapke tables ke baare mein batane ke liye yeh zaroori hai.
from models import Base

# =================================================================
# ===                  END OF CUSTOM CHANGES                    ===
# =================================================================

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata

# =================================================================
# ===                 START OF CUSTOM CHANGES                   ===
# =================================================================

# 3. Set the target_metadata to your Base
#    Yeh Alembic ko batata hai ki use aapke `models.py` ke tables ko dekhna hai.
target_metadata = Base.metadata

# =================================================================
# ===                  END OF CUSTOM CHANGES                    ===
# =================================================================

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    # =================================================================
    # ===                 START OF CUSTOM CHANGES                   ===
    # =================================================================
    # 4. Set the URL from environment variable
    #    Yeh .env file se DB URL leta hai aur use alembic.ini ki value par
    #    overwrite karta hai. Yeh NameError ko fix karta hai.
    if os.environ.get("DATABASE_URL"):
        config.set_main_option('sqlalchemy.url', os.environ.get('DATABASE_URL'))
    # =================================================================
    # ===                  END OF CUSTOM CHANGES                    ===
    # =================================================================
    
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # =================================================================
    # ===                 START OF CUSTOM CHANGES                   ===
    # =================================================================
    # 5. Set the URL from environment variable here as well for consistency
    if os.environ.get("DATABASE_URL"):
        config.set_main_option('sqlalchemy.url', os.environ.get('DATABASE_URL'))
    # =================================================================
    # ===                  END OF CUSTOM CHANGES                    ===
    # =================================================================

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()