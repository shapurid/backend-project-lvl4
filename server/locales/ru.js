module.exports = {
  translation: {
    appName: 'Менеджер задач',
    flash: {
      session: {
        create: {
          success: 'Вы успешно авторизованы.',
          error: 'Неправильный e-mail и/или пароль.',
        },
        delete: {
          success: 'До свидания. Ждем Вас снова!',
        },
      },
      users: {
        create: {
          success: 'Пользователь успешно зарегистрирован.',
          error: 'Ошибка регистрации пользователя.',
        },
        modify: {
          success: 'Профиль успешно обновлён.',
        },
        delete: {
          success: 'Пользователь успешно удалён.',
          error: 'Невозможно удались пользователя, поскольку у Вас есть еще не удаленные задачи.',
        },
      },
      taskStatuses: {
        create: {
          success: 'Статус задачи успешно зарегистрирован.',
          error: 'Ошибка регистрации статуса.',
        },
        modify: {
          success: 'Статус задачи успешно обновлён.',
        },
        delete: {
          success: 'Статус задачи успешно удалён.',
          error: 'Невозможно удалить статус, так как он используется в одной из задач.',
        },
      },
      tasks: {
        create: {
          success: 'Задача успешно создана.',
          error: 'Невозможно создать задачу.',
        },
        modify: {
          success: 'Задача успешно изменена.',
          error: 'Ошибка изменения задачи.',
        },
        delete: {
          success: 'Задача успешно удалена.',
        },
      },
      labels: {
        create: {
          success: 'Тег успешно создан.',
          error: 'Ошибка регистрации тега.',
        },
        modify: {
          success: 'Тег успешно изменен.',
          error: 'Ошибка регистрации тега.',
        },
        delete: {
          success: 'Тег успешно удален.',
        },
      },
    },
    layouts: {
      app: {
        users: 'Пользователи',
        taskStatuses: 'Статусы задач',
        tasks: 'Список задач',
        labels: 'Список тегов',
        own: 'Личный кабинет',
        signIn: 'Вход',
        signUp: 'Регистрация',
        signOut: 'Выход',
      },
    },
    views: {
      session: {
        new: {
          email: {
            label: 'E-mail',
          },
          password: {
            label: 'Пароль',
          },
          submit: 'Войти',
          signIn: 'Вход',
        },
      },
      users: {
        index: {
          firstName: 'Имя',
          lastName: 'Фамилия',
          email: 'E-mail',
          watchProfile: 'Посмотреть профиль',
        },
        new: {
          firstName: {
            label: 'Имя',
            error: 'Введите имя',
          },
          lastName: {
            label: 'Фамилия',
            error: 'Введите фамилию',
          },
          email: {
            label: 'E-mail',
            error: 'Введите корректный e-mail адрес',
          },
          password: {
            label: 'Пароль',
            error: 'Введите пароль',
          },
          submit: 'Зарегистрироваться',
        },
        profile: {
          firstName: {
            label: 'Имя',
            error: 'Введите имя',
          },
          lastName: {
            label: 'Фамилия',
            error: 'Введите фамилию',
          },
          email: {
            label: 'E-mail',
            error: 'Введите корректный e-mail адрес',
          },
          password: {
            label: 'Пароль',
            error: 'Введите пароль',
          },
          patch: 'Изменить профиль',
          delete: 'Удалить профиль',
        },
      },
      welcome: {
        hello: 'Привет',
        guest: 'Гость',
        description: 'Это менеджер задач, созданный shapurid.',
      },
      taskStatuses: {
        index: {
          name: 'Имя статуса',
          edit: 'Переименовать',
          delete: 'Удалить статус',
          new: 'Добавить статус',
        },
        new: {
          name: {
            label: 'Введите название статуса задачи',
            error: 'Введите корректное имя статуса задачи',
          },
          submit: 'Создать статус задачи',
          error: 'Введите верное имя статуса задачи',
          button: 'Добавить статус задачи',
        },
        edit: {
          name: {
            label: 'Введите название статуса задачи',
            error: 'Введите корректное имя статуса задачи',
          },
          patch: 'Изменить статус',
        },
      },
      tasks: {
        filters: {
          taskStatusId: {
            label: 'Статусы',
          },
          executorId: {
            label: 'Исполнители',
          },
          labels: {
            id: {
              label: 'Теги',
            },
          },
          submit: 'Применить фильтры',
        },
        new: {
          name: {
            label: 'Введите имя задачи',
            error: 'Введите корректное имя задачи.',
          },
          taskStatusId: {
            label: 'Введите имя статуса задачи',
          },
          executorId: {
            label: 'Выберите исполнителя задачи',
          },
          labels: {
            label: 'Выберите теги',
          },
          description: {
            label: 'Введите описание задачи',
          },
          submit: 'Создать задачу',
        },
        edit: {
          name: {
            label: 'Введите имя задачи',
            error: 'Введите корректное имя задачи.',
          },
          taskStatusId: {
            label: 'Введите имя статуса задачи',
          },
          executorId: {
            label: 'Выберите исполнителя задачи',
          },
          labels: {
            label: 'Выберите теги',
          },
          description: {
            label: 'Введите описание задачи',
          },
          patch: 'Изменить задачу',
        },
        index: {
          label: 'Выберите теги',
          name: 'Имя задачи',
          status: 'Статус задачи',
          creator: 'Создатель',
          executor: 'Исполнитель',
          add: 'Добавить задачу',
          description: 'Описание',
          show: 'Показать',
          delete: 'Удалить',
          edit: 'Редактировать',
        },
      },
      labels: {
        index: {
          name: 'Имя',
          edit: 'Переименовать',
          new: 'Добавить тег',
          delete: 'Удалить',
        },
        new: {
          name: {
            label: 'Введите имя тега',
            error: 'Введите корректное имя тега',
          },
          submit: 'Создать тег',
        },
        edit: {
          name: {
            label: 'Введите имя тега',
            error: 'Введите корректное имя тега',
          },
          patch: 'Изменить тег',
        },
      },
    },
    errors: {
      404: '404: Упс, страница не найдена',
      403: '403: Доступ запрещён!',
    },
  },
};
