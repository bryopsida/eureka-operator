# Eureka Operator Ansible Role

## What is this?

This is a role with supporting playbooks and inventory examples to deploy and manage many instances of a eureka-operator.
Ideally, in the future this will be replaced with a debian package but this role allows pushing revisions directly out for faster iterations, 
the permissions, systemd unit etc, from the role will be used to determine needs for the debian package.

## How to deploy

You'll need to establish ssh trust with your target machines using ssh-copy-id and to setup an inventory. The user you wish to use to connect should be defined/configured in `.ssh/config`.

When you have an inventory ready (see inventory/example.ini for variable examples) you can use `make eureka-operators` to apply the latest revision to your machines.

This is meant for prototyping/verification and long term the operator will be seeded by a buildroot image or cloud-init profile and available as a .deb.
