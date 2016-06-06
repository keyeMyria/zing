# -*- coding: utf-8 -*-
#
# Copyright (C) Pootle contributors.
#
# This file is a part of the Pootle project. It is distributed under the GPL3
# or later license. See the LICENSE file for a copy of the license and the
# AUTHORS file for copyright and authorship information.

from django.contrib.auth.models import BaseUserManager
from django.utils import timezone
from django.utils.lru_cache import lru_cache

from . import utils


__all__ = ('UserManager', )


class UserManager(BaseUserManager):
    """Pootle User manager.

    This manager hides the 'nobody' and 'default' users for normal
    queries, since they are special users. Code that needs access to these
    users should use the methods get_default_user and get_nobody_user.
    """

    PERMISSION_USERS = ('default', 'nobody')
    META_USERS = ('default', 'nobody', 'system')

    def _create_user(self, username, email, password, is_superuser,
                     **extra_fields):
        """Creates and saves a User with the given username, email,
        password and superuser status.

        Adapted from the core ``auth.User`` model's ``UserManager``: we
        have no use for the ``is_staff`` field.
        """
        now = timezone.now()
        if not username:
            raise ValueError('The given username must be set')

        email = self.normalize_email(email)
        utils.validate_email_unique(email)
        user = self.model(username=username, email=email,
                          is_active=True, is_superuser=is_superuser,
                          last_login=now, date_joined=now, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_user(self, username, email=None, password=None, **extra_fields):
        return self._create_user(username, email, password, False,
                                 **extra_fields)

    def create_superuser(self, username, email, password, **extra_fields):
        return self._create_user(username, email, password, True,
                                 **extra_fields)

    @lru_cache()
    def get_default_user(self):
        return self.get_queryset().get(username='default')

    @lru_cache()
    def get_nobody_user(self):
        return self.get_queryset().get(username='nobody')

    @lru_cache()
    def get_system_user(self):
        return self.get_queryset().get(username='system')

    def hide_permission_users(self):
        return self.get_queryset().exclude(username__in=self.PERMISSION_USERS)

    def hide_meta(self):
        return self.get_queryset().exclude(username__in=self.META_USERS)

    def meta_users(self):
        return self.get_queryset().filter(username__in=self.META_USERS)
