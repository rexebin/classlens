# Class IO

![ClassIO](./classio.gif "Showcase")

Class IO is an alternative extension to ClassLens, it shows relationships with its interfaces and parent class in a non-obstructive way.

Unlike ClassLens, Class IO is not a CodeLens provider and therefore it does not require CodeLens to be enabled.

Class IO analyse document symbols on opening a Typescript/Javascript file and marks the following members in an class:

1.  any class member that is an implemtations of the class's interfaces.
2.  any class member that overides base class' member.

![ClassIO](./classio-screen.png)

There are two way to quickly navigate to parent:

1.  **Go To Definition**: Class IO also allows you to quickly navigate to the parent member by provde extra defintion to above marked members. To navigate to parent members, use Go To Definition and choose the parent member in the peak defintion popup.

2.  **Context menu or keyboard shortcut**: Class IO also provide a command and a context menu item to navigate to parent: while cursor is on the child member, right click mouse and choose "Go To Parent", or click the default keybinding: Alt+Shift+G

# Performance

Class IO builds up a database alike cache as you develop your project. Therefore it will cost you hardly anything after it has seen all of your class structures.

Caches will be saved to workspace state and each time you open vscode, Class IO will recover the cache from workspace state.

# Cache

To clean workspace cache:

CTRL/CMD + P: then search for "Class IO: Clean Cache".

# Configuration

Change the markup symbols and color with the following configuration:

```
  // The symbol will be attached to before interface implementation members.
  "classio.implmentationSymbol": "i ",

  // The color of attached implmentation symbol.
  "classio.implmentationSymbolColor": "rgba(128,128,128,1)",

  // The symbol will be attached to before override member.
  "classio.overrideSymbol": "o ",

  // The color of attached override symbol.
  "classio.overrideSymbolColor": "rgba(128,128,128,1)"
```

# Links

[Github Repository](https://github.com/rexebin/classlens/tree/colorandshortcut)

[Install ClassLens from VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=rexebin.classio)
