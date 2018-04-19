# ClassLens

![ClassLens](./classlens.png "Showcase")

![ClassLens](./classlens.gif "Showcase")

I switch from Webstorm to VSCode and find myself missing a feature miserably: the ability to see which members in a TypeScript class are overides to a base class and which members are interface implementations with a glance in the very class, plus the ability to go to the parent member quickly. Failing to find anything in the Marketplace, I finally made this extension **ClassLens**, just to do what Webstorm does in VSCode in the form of CodeLens.

As the name implies, it is a Codelens extension marking the following members in a opened class with CodeLens enabled:

1.  any class member that is an implemtations of the class's interfaces.
2.  any class member that overides base class' member.

ClassLens also allows you to quickly navigate to the parent member by clicking on the CodeLens hint. File will be opened side by side by default. You can change the behaviour by adding this configuration to `User Settings`:

```
"classLens.openSideBySide": false
```

Important: ClassLens is a TypeSCript Codelens extension, it requires CodeLens to be enabled to be triggered.

# Repository

[Github Repository](https://github.com/rexebin/classlens)
