# classlens README

I switch from Webstorm to Vscode and find myself missing a feature misrablly: the ability to see which members in a class is an overide to a base class and which members are interface implementations, with a glance in a TypeScript class. Plus the ability to go to the parent member quickly. Failing to find anything in the Marketplace, I finally sit down and made this extension **ClassLens**, just to provide what I am missing.

As the name implies, it is a Codelens marking the following in a class:

1.  any class members that are implemtations of the class's interfaces.
2.  any class members that overide base class' members.

ClassLens also allows you to quickly navigate to the parent member by clicking on the CodeLens hint. File will be opened side by side by default. You can change the behavior by adding this configuration to `User Settings`:

```
"classLens.openSideBySide": false
```

ClassLens is a TypeSCript Codelens extension, it requires CodeLens to be enabled to be triggered.

# Repository

[source](https://github.com/rexebin/classlens)
