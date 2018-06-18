# Change Log

## 0.7.0

Now works for vscode 1.2.4.

Now works for namespace with types in tsconfig.json(better support for react projects).

## 0.6.2

Add limitations in readme.

## 0.6.1

Add language support for react tsx.

## 0.6.0

Add support for namespace.

## 0.5.0

1.  Restructure Cache: please clear cache after update.
2.  optimize performance.

## 0.4.3

Fix: navigation - broken in 0.4.0 due to vscode's cache serialisation.
Fix: now correctly work with "extends" in generic signature.
Improve: now save only necessary information to cache.

## 0.4.0

Now save and load cache for each project, so that cache is not required to rebuild each time vscode is restarted.

## 0.3.0

Rewrite Definition and Symbols lookup, performance should increase considerably.

## 0.2.2

Optimise cache and increase performance.

## 0.2.1

Fix: class with generic signature now work as intended.

## 0.2.0

Optimise cache and performance increased

## 0.1.0

- Add Javascript support
- fix bug: child and parent class in the same file now should work.

## 0.0.1

- Initial release
